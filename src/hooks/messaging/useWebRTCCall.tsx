import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToastNotifications } from '@/hooks/common/useToastNotifications';
import { WebRTCManager } from '@/utils/webrtc';
import { supabase } from '@/integrations/supabase/client';
import { createSafeSubscription } from '@/utils/realtimeUtils';
import { useCallPermissions } from '@/hooks/mobile/useCallPermissions';

export const useWebRTCCall = (conversationId: string) => {
  const { user } = useAuth();
  const { showError, showSuccess } = useToastNotifications();
  const { requestMicrophoneForCall, requestVideoCallPermissions } = useCallPermissions();
  
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

  const webrtcRef = useRef<WebRTCManager | null>(null);
  const pendingMessagesRef = useRef<any[]>([]);

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
      console.log('Starting voice call - requesting microphone permission');
      
      // Request microphone permission first
      const hasPermission = await requestMicrophoneForCall();
      if (!hasPermission) {
        console.log('Microphone permission denied');
        return;
      }
      
      showSuccess("Connecting...", "Setting up voice call");
      
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
      
      showSuccess("Voice call", "Calling...");
    } catch (error) {
      console.error('Error starting voice call:', error);
      const errorMessage = error instanceof Error ? error.message : "Could not start voice call";
      showError("Voice call failed", errorMessage);
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
      
      showSuccess("Connecting...", "Setting up video call");
      
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
      
      showSuccess("Video call", "Calling...");
    } catch (error) {
      console.error('Error starting video call:', error);
      const errorMessage = error instanceof Error ? error.message : "Could not start video call";
      showError("Video call failed", errorMessage);
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

  // Listen for signaling messages with fallback polling
  useEffect(() => {
    if (!user?.id) return;

    console.log('Setting up signaling subscription for conversation:', conversationId);
    let pollingInterval: NodeJS.Timeout | null = null;
    const processedMessageIds = new Set<string>();

    // Handle signaling messages
    const handleSignalingMessage = async (message: any) => {
      // Ignore messages from ourselves
      if (message.sender_id === user.id) return;
      
      // Prevent duplicate processing
      if (processedMessageIds.has(message.id)) return;
      processedMessageIds.add(message.id);

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
          if (!processedMessageIds.has(message.id)) {
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
    const subscription = createSafeSubscription(
      (channel) => {
        return channel.on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'call_signaling',
            filter: `conversation_id=eq.${conversationId}`
          },
          async (payload) => {
            console.log('Received signaling message via realtime:', payload);
            await handleSignalingMessage(payload.new);
          }
        );
      },
      {
        channelName: `call_signaling_${conversationId}`,
        debugName: 'WebRTCCall',
        onError: startPollingFallback,
        pollInterval: 2000,
      }
    );

    return () => {
      console.log('Cleaning up signaling subscription and polling');
      subscription.unsubscribe();
    };
  }, [conversationId, user?.id]); // Removed webrtcManager dependency

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