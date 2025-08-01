import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type CallStatus = 'idle' | 'calling' | 'incoming' | 'connected' | 'ended';
export type CallType = 'voice' | 'video';

interface CallOffer {
  type: 'offer' | 'answer' | 'ice-candidate' | 'call-end';
  data: any;
  callId: string;
  callType: CallType;
  fromUserId: string;
  toUserId: string;
}

export const useWebRTCCall = (userId: string) => {
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [callType, setCallType] = useState<CallType>('voice');
  const [incomingCall, setIncomingCall] = useState<CallOffer | null>(null);
  const [remoteUserId, setRemoteUserId] = useState<string | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const remoteStream = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const callId = useRef<string | null>(null);
  
  const { toast } = useToast();

  // Initialize peer connection
  const initializePeerConnection = useCallback(() => {
    if (peerConnection.current) return;

    peerConnection.current = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    // Handle remote stream
    peerConnection.current.ontrack = (event) => {
      console.log('Received remote stream');
      remoteStream.current = event.streams[0];
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream.current;
      }
    };

    // Handle ICE candidates
    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate && callId.current && remoteUserId) {
        sendSignalingMessage({
          type: 'ice-candidate',
          data: event.candidate,
          callId: callId.current,
          callType,
          fromUserId: userId,
          toUserId: remoteUserId
        });
      }
    };

    // Handle connection state changes
    peerConnection.current.onconnectionstatechange = () => {
      const state = peerConnection.current?.connectionState;
      console.log('Connection state:', state);
      
      if (state === 'connected') {
        setCallStatus('connected');
        toast({
          title: "Call connected",
          description: "You are now connected",
        });
      } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        endCall();
      }
    };
  }, [userId, remoteUserId, callType, toast]);

  // Get user media
  const getUserMedia = useCallback(async (video: boolean) => {
    try {
      const constraints = {
        audio: true,
        video: video ? { width: 640, height: 480 } : false
      };
      
      localStream.current = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (localVideoRef.current && video) {
        localVideoRef.current.srcObject = localStream.current;
      }
      
      // Add tracks to peer connection
      if (peerConnection.current) {
        localStream.current.getTracks().forEach(track => {
          peerConnection.current?.addTrack(track, localStream.current!);
        });
      }
      
      return localStream.current;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      toast({
        title: "Media access error",
        description: "Could not access camera/microphone",
        variant: "destructive"
      });
      throw error;
    }
  }, [toast]);

  // Send signaling message through Supabase
  const sendSignalingMessage = useCallback(async (message: CallOffer) => {
    try {
      const { error } = await supabase
        .from('call_signals')
        .insert([{
          call_id: message.callId,
          type: message.type,
          data: message.data,
          from_user_id: message.fromUserId,
          to_user_id: message.toUserId,
          call_type: message.callType,
          created_at: new Date().toISOString()
        }]);

      if (error) {
        console.error('Error sending signaling message:', error);
      }
    } catch (error) {
      console.error('Error sending signaling message:', error);
    }
  }, []);

  // Start call
  const startCall = useCallback(async (targetUserId: string, type: CallType) => {
    try {
      setCallType(type);
      setRemoteUserId(targetUserId);
      setCallStatus('calling');
      
      callId.current = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      initializePeerConnection();
      await getUserMedia(type === 'video');
      
      // Create offer
      const offer = await peerConnection.current!.createOffer();
      await peerConnection.current!.setLocalDescription(offer);
      
      // Send offer
      await sendSignalingMessage({
        type: 'offer',
        data: offer,
        callId: callId.current,
        callType: type,
        fromUserId: userId,
        toUserId: targetUserId
      });

      toast({
        title: "Calling...",
        description: "Connecting to user",
      });
      
    } catch (error) {
      console.error('Error starting call:', error);
      setCallStatus('idle');
      toast({
        title: "Call failed",
        description: "Could not start the call",
        variant: "destructive"
      });
    }
  }, [userId, initializePeerConnection, getUserMedia, sendSignalingMessage, toast]);

  // Answer call
  const answerCall = useCallback(async () => {
    if (!incomingCall || !peerConnection.current) return;

    try {
      setCallStatus('connected');
      setRemoteUserId(incomingCall.fromUserId);
      callId.current = incomingCall.callId;
      
      await getUserMedia(incomingCall.callType === 'video');
      
      // Set remote description
      await peerConnection.current.setRemoteDescription(incomingCall.data);
      
      // Create answer
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      
      // Send answer
      await sendSignalingMessage({
        type: 'answer',
        data: answer,
        callId: incomingCall.callId,
        callType: incomingCall.callType,
        fromUserId: userId,
        toUserId: incomingCall.fromUserId
      });

      setIncomingCall(null);
      
      toast({
        title: "Call answered",
        description: "Connected to caller",
      });
      
    } catch (error) {
      console.error('Error answering call:', error);
      rejectCall();
    }
  }, [incomingCall, userId, getUserMedia, sendSignalingMessage, toast]);

  // Reject call
  const rejectCall = useCallback(async () => {
    if (incomingCall) {
      await sendSignalingMessage({
        type: 'call-end',
        data: null,
        callId: incomingCall.callId,
        callType: incomingCall.callType,
        fromUserId: userId,
        toUserId: incomingCall.fromUserId
      });
    }
    
    setIncomingCall(null);
    setCallStatus('idle');
  }, [incomingCall, userId, sendSignalingMessage]);

  // End call
  const endCall = useCallback(async () => {
    // Send end call signal
    if (callId.current && remoteUserId) {
      await sendSignalingMessage({
        type: 'call-end',
        data: null,
        callId: callId.current,
        callType,
        fromUserId: userId,
        toUserId: remoteUserId
      });
    }

    // Clean up
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop());
      localStream.current = null;
    }
    
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    
    setCallStatus('idle');
    setRemoteUserId(null);
    callId.current = null;
    setIncomingCall(null);
    
    toast({
      title: "Call ended",
      description: "The call has been disconnected",
    });
  }, [callId, remoteUserId, callType, userId, sendSignalingMessage, toast]);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (localStream.current) {
      const audioTrack = localStream.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  }, []);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStream.current) {
      const videoTrack = localStream.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  }, []);

  // Handle incoming signaling messages
  const handleSignalingMessage = useCallback(async (message: CallOffer) => {
    console.log('Received signaling message:', message);
    
    switch (message.type) {
      case 'offer':
        if (callStatus === 'idle') {
          setIncomingCall(message);
          setCallType(message.callType);
          initializePeerConnection();
        }
        break;
        
      case 'answer':
        if (peerConnection.current && message.data) {
          await peerConnection.current.setRemoteDescription(message.data);
          setCallStatus('connected');
        }
        break;
        
      case 'ice-candidate':
        if (peerConnection.current && message.data) {
          await peerConnection.current.addIceCandidate(message.data);
        }
        break;
        
      case 'call-end':
        endCall();
        break;
    }
  }, [callStatus, initializePeerConnection, endCall]);

  // Subscribe to call signals
  useEffect(() => {
    const subscription = supabase
      .channel('call_signals')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_signals',
          filter: `to_user_id=eq.${userId}`,
        },
        (payload) => {
          const message: CallOffer = {
            type: payload.new.type,
            data: payload.new.data,
            callId: payload.new.call_id,
            callType: payload.new.call_type,
            fromUserId: payload.new.from_user_id,
            toUserId: payload.new.to_user_id
          };
          handleSignalingMessage(message);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId, handleSignalingMessage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endCall();
    };
  }, [endCall]);

  return {
    callStatus,
    callType,
    incomingCall,
    remoteUserId,
    isAudioEnabled,
    isVideoEnabled,
    localVideoRef,
    remoteVideoRef,
    startCall,
    answerCall,
    rejectCall,
    endCall,
    toggleAudio,
    toggleVideo
  };
};