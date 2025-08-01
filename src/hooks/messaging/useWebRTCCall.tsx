import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToastNotifications } from '@/hooks/common/useToastNotifications';
import { WebRTCManager } from '@/utils/webrtc';
import { supabase } from '@/integrations/supabase/client';

export const useWebRTCCall = (conversationId: string) => {
  const { user } = useAuth();
  const { showError, showSuccess } = useToastNotifications();
  
  const [webrtcManager, setWebrtcManager] = useState<WebRTCManager | null>(null);
  const [isInCall, setIsInCall] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [incomingCall, setIncomingCall] = useState<{
    offer: RTCSessionDescriptionInit;
    callType: 'audio' | 'video';
    fromUserId: string;
  } | null>(null);

  // Initialize WebRTC manager
  const initializeManager = useCallback(() => {
    if (!user?.id) return null;

    const manager = new WebRTCManager(
      conversationId,
      user.id,
      (stream) => {
        console.log('Remote stream received');
        setRemoteStream(stream);
      },
      () => {
        console.log('Call ended');
        setIsInCall(false);
        setIsVideoCall(false);
        setLocalStream(null);
        setRemoteStream(null);
        setWebrtcManager(null);
      }
    );

    return manager;
  }, [conversationId, user?.id]);

  // Start voice call
  const startVoiceCall = useCallback(async () => {
    try {
      const manager = initializeManager();
      if (!manager) return;

      const stream = await manager.startCall(false);
      setWebrtcManager(manager);
      setLocalStream(stream);
      setIsInCall(true);
      setIsVideoCall(false);
      
      showSuccess("Voice call", "Calling...");
    } catch (error) {
      console.error('Error starting voice call:', error);
      showError("Error", "Could not start voice call");
    }
  }, [initializeManager, showSuccess, showError]);

  // Start video call
  const startVideoCall = useCallback(async () => {
    try {
      const manager = initializeManager();
      if (!manager) return;

      const stream = await manager.startCall(true);
      setWebrtcManager(manager);
      setLocalStream(stream);
      setIsInCall(true);
      setIsVideoCall(true);
      
      showSuccess("Video call", "Calling...");
    } catch (error) {
      console.error('Error starting video call:', error);
      showError("Error", "Could not start video call");
    }
  }, [initializeManager, showSuccess, showError]);

  // Answer incoming call
  const answerCall = useCallback(async (acceptVideo: boolean = false) => {
    if (!incomingCall) return;

    try {
      const manager = initializeManager();
      if (!manager) return;

      const stream = await manager.answerCall(incomingCall.offer, acceptVideo);
      manager.markCallAsAnswered();
      
      setWebrtcManager(manager);
      setLocalStream(stream);
      setIsInCall(true);
      setIsVideoCall(acceptVideo);
      setIncomingCall(null);
      
      showSuccess("Call connected", "");
    } catch (error) {
      console.error('Error answering call:', error);
      showError("Error", "Could not answer call");
      setIncomingCall(null);
    }
  }, [incomingCall, initializeManager, showSuccess, showError]);

  // Decline incoming call
  const declineCall = useCallback(() => {
    if (webrtcManager) {
      webrtcManager.markCallAsDeclined();
    }
    setIncomingCall(null);
  }, [webrtcManager]);

  // End current call
  const endCall = useCallback(() => {
    if (webrtcManager) {
      webrtcManager.endCall();
    }
    setIsInCall(false);
    setIsVideoCall(false);
    setLocalStream(null);
    setRemoteStream(null);
    setWebrtcManager(null);
  }, [webrtcManager]);

  // Toggle audio
  const toggleAudio = useCallback((enabled: boolean) => {
    if (webrtcManager) {
      webrtcManager.toggleAudio(enabled);
    }
  }, [webrtcManager]);

  // Toggle video
  const toggleVideo = useCallback((enabled: boolean) => {
    if (webrtcManager) {
      webrtcManager.toggleVideo(enabled);
    }
  }, [webrtcManager]);

  // Listen for signaling messages
  useEffect(() => {
    if (!user?.id) return;

    console.log('Setting up signaling subscription for conversation:', conversationId);

    const channel = supabase
      .channel(`call_signaling:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_signaling',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          console.log('Received signaling message:', payload);
          const message = payload.new;

          // Ignore messages from ourselves
          if (message.sender_id === user.id) return;

          if (message.message.type === 'offer') {
            console.log('Incoming call offer received');
            // Incoming call
            setIncomingCall({
              offer: message.message.offer,
              callType: message.message.callType || 'audio',
              fromUserId: message.sender_id
            });
          } else if (message.message.type === 'answer' && webrtcManager) {
            console.log('Call answer received');
            // Call was answered
            webrtcManager.markCallAsAnswered();
            await webrtcManager.handleSignalingMessage(message.message);
          } else if (webrtcManager) {
            console.log('Other signaling message:', message.message.type);
            // Handle other signaling messages
            await webrtcManager.handleSignalingMessage(message.message);
          }
        }
      )
      .subscribe((status) => {
        console.log('Call signaling subscription status:', status);
      });

    return () => {
      console.log('Cleaning up signaling subscription');
      supabase.removeChannel(channel);
    };
  }, [conversationId, user?.id, webrtcManager]);

  return {
    isInCall,
    isVideoCall,
    localStream,
    remoteStream,
    incomingCall,
    startVoiceCall,
    startVideoCall,
    answerCall,
    declineCall,
    endCall,
    toggleAudio,
    toggleVideo,
  };
};