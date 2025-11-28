import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToastNotifications } from '@/hooks/common/useToastNotifications';
import { WebRTCManager } from '@/utils/webrtc';
import { supabase } from '@/integrations/supabase/client';
import { createSafeSubscription } from '@/utils/realtimeUtils';
import { useCallPermissions } from '@/hooks/mobile/useCallPermissions';
import { startRingbackTone, stopRingbackTone } from '@/utils/audioUtils';

export type CallState = 'idle' | 'initiating' | 'ringing' | 'connecting' | 'connected' | 'ended';

export const useWebRTCCall = (conversationId: string) => {
  const { user } = useAuth();
  const { showError, showSuccess } = useToastNotifications();
  const { requestMicrophoneForCall, requestVideoCallPermissions } = useCallPermissions();
  
  const [webrtcManager, setWebrtcManager] = useState<WebRTCManager | null>(null);
  const [isInCall, setIsInCall] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [callState, setCallState] = useState<CallState>('idle');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [incomingCall, setIncomingCall] = useState<{
    offer: RTCSessionDescriptionInit;
    callType: 'audio' | 'video';
    fromUserId: string;
  } | null>(null);

  const webrtcRef = useRef<WebRTCManager | null>(null);
  const pendingMessagesRef = useRef<any[]>([]);
  const processedMessageIdsRef = useRef<Set<string>>(new Set());

  // Initialize WebRTC manager
  const initializeManager = useCallback(() => {
    if (!user?.id) return null;

    const manager = new WebRTCManager(
      conversationId,
      user.id,
      (stream) => {
        console.log('Remote stream received - call connected');
        setRemoteStream(stream);
        setCallState('connected');
      },
      (reason?: 'ended' | 'declined' | 'failed' | 'disconnected') => {
        console.log('Call ended, reason:', reason);
        if (reason === 'disconnected') {
          showError("Call Disconnected", "The other person lost connection");
        } else if (reason === 'declined') {
          showError("Call Declined", "The call was declined");
        } else if (reason === 'failed') {
          showError("Call Failed", "Unable to establish connection");
        }
        setCallState('ended');
        setIsInCall(false);
        setIsVideoCall(false);
        setLocalStream(null);
        setRemoteStream(null);
        setWebrtcManager(null);
      },
      () => {
        // onOfferSent callback
        console.log('Offer sent - call is now ringing');
        setCallState('ringing');
        startRingbackTone();
      },
      () => {
        // onAnswerReceived callback
        console.log('Answer received - call is now connecting');
        setCallState('connecting');
        stopRingbackTone();
      }
    );

    return manager;
  }, [conversationId, user?.id, showError]);

  // Start voice call
  const startVoiceCall = useCallback(async () => {
    try {
      console.log('Starting voice call - requesting microphone permission');
      
      // Request microphone permission first
      const hasPermission = await requestMicrophoneForCall();
      if (!hasPermission) {
        console.log('Microphone permission denied');
        return;
      }
      
      setCallState('initiating');
      showSuccess("Initiating...", "Setting up voice call");
      
      const manager = initializeManager();
      if (!manager) return;

      const stream = await manager.startCall(false);
      setWebrtcManager(manager);
      webrtcRef.current = manager;
      
      // Process any pending messages
      if (pendingMessagesRef.current.length > 0) {
        console.log(`Processing ${pendingMessagesRef.current.length} pending messages`);
        
        // Sort to process answer first, then ICE candidates
        const sorted = pendingMessagesRef.current.sort((a, b) => {
          if (a.type === 'answer') return -1;
          if (b.type === 'answer') return 1;
          return 0;
        });
        
        for (const msg of sorted) {
          console.log('[useWebRTCCall] Processing pending message:', msg.type);
          await manager.handleSignalingMessage(msg);
        }
        pendingMessagesRef.current = [];
      }
      
      setLocalStream(stream);
      setIsInCall(true);
      setIsVideoCall(false);
      
      // State will transition to 'ringing' after offer is sent
    } catch (error) {
      console.error('Error starting voice call:', error);
      const errorMessage = error instanceof Error ? error.message : "Could not start voice call";
      showError("Voice call failed", errorMessage);
      setCallState('idle');
    }
  }, [initializeManager, showSuccess, showError, requestMicrophoneForCall]);

  // Start video call
  const startVideoCall = useCallback(async () => {
    try {
      console.log('Starting video call - requesting camera and microphone permissions');
      
      // Request both camera and microphone permissions first
      const hasPermissions = await requestVideoCallPermissions();
      if (!hasPermissions) {
        console.log('Camera or microphone permission denied');
        return;
      }
      
      setCallState('initiating');
      showSuccess("Initiating...", "Setting up video call");
      
      const manager = initializeManager();
      if (!manager) return;

      const stream = await manager.startCall(true);
      setWebrtcManager(manager);
      webrtcRef.current = manager;
      
      // Process any pending messages
      if (pendingMessagesRef.current.length > 0) {
        console.log(`Processing ${pendingMessagesRef.current.length} pending messages`);
        
        // Sort to process answer first, then ICE candidates
        const sorted = pendingMessagesRef.current.sort((a, b) => {
          if (a.type === 'answer') return -1;
          if (b.type === 'answer') return 1;
          return 0;
        });
        
        for (const msg of sorted) {
          console.log('[useWebRTCCall] Processing pending message:', msg.type);
          await manager.handleSignalingMessage(msg);
        }
        pendingMessagesRef.current = [];
      }
      
      setLocalStream(stream);
      setIsInCall(true);
      setIsVideoCall(true);
      
      // State will transition to 'ringing' after offer is sent
    } catch (error) {
      console.error('Error starting video call:', error);
      const errorMessage = error instanceof Error ? error.message : "Could not start video call";
      showError("Video call failed", errorMessage);
      setCallState('idle');
    }
  }, [initializeManager, showSuccess, showError, requestVideoCallPermissions]);

  // Answer incoming call
  const answerCall = useCallback(async (acceptVideo: boolean = false) => {
    if (!incomingCall) return;

    try {
      console.log('Answering call - video:', acceptVideo, '- requesting permissions');
      
      // Request appropriate permissions before answering
      let hasPermissions = false;
      if (acceptVideo) {
        hasPermissions = await requestVideoCallPermissions();
      } else {
        hasPermissions = await requestMicrophoneForCall();
      }
      
      if (!hasPermissions) {
        console.log('Permission denied - cannot answer call');
        setIncomingCall(null);
        return;
      }
      
      showSuccess("Connecting...", "Joining the call");
      
      const manager = initializeManager();
      if (!manager) return;

      const stream = await manager.answerCall(incomingCall.offer, acceptVideo);
      manager.markCallAsAnswered();
      
      setWebrtcManager(manager);
      webrtcRef.current = manager;
      
      // Process any pending messages
      if (pendingMessagesRef.current.length > 0) {
        console.log(`Processing ${pendingMessagesRef.current.length} pending messages`);
        
        // Sort to process answer first, then ICE candidates
        const sorted = pendingMessagesRef.current.sort((a, b) => {
          if (a.type === 'answer') return -1;
          if (b.type === 'answer') return 1;
          return 0;
        });
        
        for (const msg of sorted) {
          console.log('[useWebRTCCall] Processing pending message:', msg.type);
          await manager.handleSignalingMessage(msg);
        }
        pendingMessagesRef.current = [];
      }
      
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
  }, [incomingCall, initializeManager, showSuccess, showError, requestMicrophoneForCall, requestVideoCallPermissions]);

  // Decline incoming call
  const declineCall = useCallback(async () => {
    console.log('Declining call');
    
    // Send decline signal to notify the caller
    if (incomingCall && user?.id) {
      try {
        await supabase.from('call_signaling').insert({
          conversation_id: conversationId,
          sender_id: user.id,
          message: { type: 'call-decline' }
        });
        console.log('Decline signal sent');
      } catch (error) {
        console.error('Error sending decline signal:', error);
      }
    }
    
    if (webrtcManager) {
      webrtcManager.markCallAsDeclined();
    }
    setIncomingCall(null);
  }, [incomingCall, conversationId, user?.id, webrtcManager]);

  // End current call
  const endCall = useCallback(() => {
    if (webrtcManager) {
      webrtcManager.endCall();
    }
    stopRingbackTone();
    setCallState('idle');
    setIsInCall(false);
    setIsVideoCall(false);
    setLocalStream(null);
    setRemoteStream(null);
    setWebrtcManager(null);
    webrtcRef.current = null;
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

  // Switch camera (front/back)
  const switchCamera = useCallback(async () => {
    if (webrtcManager) {
      try {
        await webrtcManager.switchCamera();
        showSuccess("Camera switched", "");
      } catch (error) {
        console.error('Error switching camera:', error);
        showError("Error", "Could not switch camera");
      }
    }
  }, [webrtcManager, showSuccess, showError]);

  // Listen for signaling messages with fallback polling
  useEffect(() => {
    if (!user?.id) return;

    console.log('Setting up signaling subscription for conversation:', conversationId);
    let pollingInterval: NodeJS.Timeout | null = null;

    // Handle signaling messages
    const handleSignalingMessage = async (message: any) => {
      // Ignore messages from ourselves
      if (message.sender_id === user.id) return;
      
      // Prevent duplicate processing
      if (processedMessageIdsRef.current.has(message.id)) return;
      processedMessageIdsRef.current.add(message.id);

      // Ignore old messages (older than 30 seconds)
      const messageAge = Date.now() - new Date(message.created_at).getTime();
      if (messageAge > 30000) {
        console.log('Ignoring old signaling message:', message.message.type);
        return;
      }

      if (message.message.type === 'offer') {
        console.log('Incoming call offer received - setting incoming call state');
        setIncomingCall({
          offer: message.message.offer,
          callType: message.message.callType || 'audio',
          fromUserId: message.sender_id
        });
      } else if (message.message.type === 'answer') {
        console.log('Call answer received');
        const mgr = webrtcRef.current;
        if (mgr) {
          mgr.markCallAsAnswered();
          await mgr.handleSignalingMessage(message.message);
        } else {
          console.log('Manager not ready, queuing answer');
          pendingMessagesRef.current.push(message.message);
        }
      } else if (message.message.type === 'ice-candidate') {
        console.log('ICE candidate received');
        const mgr = webrtcRef.current;
        if (mgr) {
          await mgr.handleSignalingMessage(message.message);
        } else {
          console.log('Manager not ready, queuing ICE candidate');
          pendingMessagesRef.current.push(message.message);
        }
      } else if (message.message.type === 'call-end') {
        console.log('Call end signal received');
        const mgr = webrtcRef.current;
        if (mgr) {
          await mgr.handleSignalingMessage(message.message);
        }
      } else if (message.message.type === 'call-decline') {
        console.log('Call decline signal received');
        const mgr = webrtcRef.current;
        if (mgr) {
          await mgr.handleSignalingMessage(message.message);
        }
      } else {
        const mgr = webrtcRef.current;
        if (mgr) {
          console.log('Other signaling message:', message.message.type);
          await mgr.handleSignalingMessage(message.message);
        } else {
          console.log('Manager not ready, queuing message');
          pendingMessagesRef.current.push(message.message);
        }
      }
    };

    // Handle incoming call notifications from push notifications
    const handleIncomingCallNotification = (event: CustomEvent) => {
      const { conversationId: callConvId, callerId, callerName, callType } = event.detail;
      
      console.log('[useWebRTCCall] Received incoming call push notification:', event.detail);
      
      // Only handle if it matches this conversation
      if (callConvId === conversationId) {
        showSuccess("Incoming Call", `${callerName} is calling...`);
        // The actual incoming call UI will be handled by call_signaling
      }
    };

    window.addEventListener('incoming-call', handleIncomingCallNotification as EventListener);

    // Polling fallback for when realtime fails
    const startPollingFallback = async () => {
      
      try {
        const { data, error } = await supabase
          .from('call_signaling')
          .select('*')
          .eq('conversation_id', conversationId)
          .neq('sender_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) {
          // Silently fail for network errors during polling
          if (!error.message?.includes('Failed to fetch')) {
            console.error('Polling error:', error);
          }
          return;
        }

        // Process new messages
        for (const message of data || []) {
          if (!processedMessageIdsRef.current.has(message.id)) {
            console.log('Received signaling message via polling:', message);
            await handleSignalingMessage(message);
            break; // Only process one message per poll
          }
        }
      } catch (error: any) {
        // Silently ignore network errors to prevent console spam
        if (error?.message && !error.message.includes('Failed to fetch')) {
          console.error('Error in polling fallback:', error);
        }
      }
    };

    // Use safe subscription with proper error handling
    // Filter by both conversation_id AND receiver_id to ensure targeted delivery
    const subscription = createSafeSubscription(
      (channel) => {
        return channel.on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'call_signaling',
            filter: `conversation_id=eq.${conversationId},receiver_id=eq.${user.id}`
          },
          async (payload) => {
            console.log('Received signaling message via realtime:', payload);
            await handleSignalingMessage(payload.new);
          }
        );
      },
      {
        channelName: `call_signaling_${conversationId}_${user.id}`,
        debugName: 'WebRTCCall',
        onError: startPollingFallback,
        pollInterval: 2000,
      }
    );

    return () => {
      console.log('Cleaning up signaling subscription and polling');
      subscription.unsubscribe();
      window.removeEventListener('incoming-call', handleIncomingCallNotification as EventListener);
    };
  }, [conversationId, user?.id, showSuccess]); // Removed webrtcManager dependency

  // Get connection stats for debugging
  const getConnectionStats = useCallback(async () => {
    if (!webrtcManager) return null;
    return await webrtcManager.getConnectionStats();
  }, [webrtcManager]);

  return {
    isInCall,
    isVideoCall,
    callState,
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
    switchCamera,
    getConnectionStats,
  };
};