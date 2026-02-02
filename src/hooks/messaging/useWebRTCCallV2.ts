import { useEffect, useRef, useState, useCallback } from "react";
import { WebRTCManagerV2 } from "@/utils/webrtcV2";
import { supabase } from "@/integrations/supabase/client";
import { useCallPermissions } from "@/hooks/mobile/useCallPermissions";
import { useToast } from "@/hooks/use-toast";
import { createSafeSubscription, cleanupSafeSubscription } from "@/utils/realtimeUtils";

type CallState = "idle" | "initiating" | "ringing" | "connecting" | "connected" | "ended";

export function useWebRTCCallV2(conversationId: string) {
  const managerRef = useRef<WebRTCManagerV2 | null>(null);

  const [incomingCall, setIncomingCall] = useState<any | null>(null);
  const [callState, setCallState] = useState<CallState>("idle");
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [isInCall, setIsInCall] = useState(false);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const { requestMicrophoneForCall, requestVideoCallPermissions } = useCallPermissions();
  const { toast } = useToast();

  const processedSignalIds = useRef<Set<string>>(new Set());
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const incomingCallTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Init manager
  useEffect(() => {
    if (managerRef.current) return;

    const mgr = new WebRTCManagerV2(conversationId);
    managerRef.current = mgr;

    mgr.onIncomingCall = (callData) => {
      setIncomingCall(callData);
      setCallState("ringing");

      // Start 40s timeout for incoming call (slightly less than caller's 45s timeout)
      if (incomingCallTimeoutRef.current) {
        clearTimeout(incomingCallTimeoutRef.current);
      }
      incomingCallTimeoutRef.current = setTimeout(() => {
        console.log("Incoming call timeout - auto-declining");
        mgr.declineCall(callData);
        setIncomingCall(null);
        setCallState("idle");
        toast({ title: "Call missed", description: "The call was not answered in time" });
      }, 40000); // 40 seconds - slightly less than caller's timeout
    };

    mgr.onCallStateUpdate = (state) => {
      setCallState(state);
      setIsInCall(state === "connected" || state === "connecting" || state === "initiating");
    };

    mgr.onLocalStream = (stream) => setLocalStream(stream);
    mgr.onRemoteStream = (stream) => setRemoteStream(stream);

    return () => {
      mgr.cleanup();
    };
  }, [conversationId]);

  // Polling fallback for signaling messages
  const pollSignalingMessages = useCallback(async () => {
    if (!managerRef.current) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: signals } = await supabase
      .from("call_signaling")
      .select("*")
      .eq("conversation_id", conversationId)
      .eq("receiver_id", user.id)
      .gte("created_at", new Date(Date.now() - 30000).toISOString())
      .order("created_at", { ascending: true });

    if (signals) {
      signals.forEach((signal) => {
        if (processedSignalIds.current.has(signal.id)) return;
        processedSignalIds.current.add(signal.id);
        managerRef.current?.handleSignalingMessage(signal);
      });
    }
  }, [conversationId]);

  // Real-time listener with fallback
  useEffect(() => {
    if (!managerRef.current || !conversationId) return;

    // Immediately poll for any missed signals on conversation open
    pollSignalingMessages();

    let subscription: any = null;

    try {
      subscription = createSafeSubscription(
        (channel) =>
          channel.on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "call_signaling",
              filter: `conversation_id=eq.${conversationId}`,
            },
            (payload) => {
              if (!payload?.new?.id) return;
              if (processedSignalIds.current.has(payload.new.id)) return;
              processedSignalIds.current.add(payload.new.id);
              managerRef.current?.handleSignalingMessage(payload.new);
            }
          ),
        {
          channelName: `webrtc-signaling-${conversationId}`,
          pollInterval: 1000, // Reduced from 2000ms to 1000ms
          debugName: "WebRTC-Signaling",
          onError: () => {
            console.log("[WebRTC] WebSocket failed, falling back to polling");
            pollSignalingMessages();
          },
        }
      );
    } catch (error) {
      console.error("[WebRTC] Failed to create subscription:", error);
      // Start polling immediately on subscription error
      const pollingInterval = setInterval(pollSignalingMessages, 1000); // Reduced from 2000ms
      pollingIntervalRef.current = pollingInterval;
    }

    return () => {
      if (subscription) {
        cleanupSafeSubscription(subscription);
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [conversationId, pollSignalingMessages]);

  /**
   * Listen for window events (e.g. from push notifications)
   */
  useEffect(() => {
    if (!conversationId) return;

    const handleIncomingCallEvent = (event: any) => {
      const { conversationId: callConvId, callType } = event.detail;

      // If the event is for this conversation, we can handle it if we're not already in a call
      if (callConvId === conversationId && callState === "idle") {
        console.log("[useWebRTCCallV2] Handling incoming-call event for conversation:", conversationId);
        // The signal listener will pick up the actual offer, but we can set 
        // a hint here or just wait for the signal. 
        // For now, let's just log it as the signal listener is robust.
      }
    };

    window.addEventListener('incoming-call', handleIncomingCallEvent);
    return () => window.removeEventListener('incoming-call', handleIncomingCallEvent);
  }, [conversationId, callState]);

  const startVoiceCall = useCallback(async () => {
    const mgr = managerRef.current;
    if (!mgr) return;

    const ok = await requestMicrophoneForCall();
    if (!ok) return;

    setIsVideoCall(false);
    setCallState("initiating");

    // Start polling as backup
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    pollingIntervalRef.current = setInterval(pollSignalingMessages, 1000); // Reduced from 2000ms

    try {
      await mgr.startCall("voice");
    } catch (err) {
      console.error("Start voice call error", err);
      toast({ title: "Failed to start voice call", variant: "destructive" });
      setCallState("idle");
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }
  }, [requestMicrophoneForCall, toast, pollSignalingMessages]);

  const startVideoCall = useCallback(async () => {
    const mgr = managerRef.current;
    if (!mgr) return;

    const ok = await requestVideoCallPermissions();
    if (!ok) return;

    setIsVideoCall(true);
    setCallState("initiating");

    // Start polling as backup
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    pollingIntervalRef.current = setInterval(pollSignalingMessages, 1000); // Reduced from 2000ms

    try {
      await mgr.startCall("video");
    } catch (err) {
      console.error("Start video call error", err);
      toast({ title: "Failed to start video call", variant: "destructive" });
      setCallState("idle");
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }
  }, [requestVideoCallPermissions, toast, pollSignalingMessages]);

  const answerCall = useCallback(
    async (video: boolean) => {
      const mgr = managerRef.current;
      if (!mgr || !incomingCall) {
        console.error("[WebRTC] Cannot answer call - manager or incomingCall is null", {
          hasManager: !!mgr,
          hasIncomingCall: !!incomingCall,
          incomingCallData: incomingCall
        });
        return;
      }

      console.log("[WebRTC] Answering call", {
        video,
        callType: incomingCall?.message?.callType,
        sessionId: incomingCall?.message?.session_id,
        sender: incomingCall?.sender_id,
        conversationId
      });

      // Clear incoming call timeout
      if (incomingCallTimeoutRef.current) {
        clearTimeout(incomingCallTimeoutRef.current);
        incomingCallTimeoutRef.current = null;
      }

      const ok = video ? await requestVideoCallPermissions() : await requestMicrophoneForCall();
      if (!ok) {
        console.error("[WebRTC] Permission denied for", video ? "video" : "audio");
        return;
      }

      setIsVideoCall(video);
      setCallState("connecting");

      try {
        await mgr.answerCall(incomingCall, video ? "video" : "voice");
        setIncomingCall(null);
        console.log("[WebRTC] Call answered successfully");

        // Log analytics for receiver
        await supabase.from("call_analytics").insert({
          conversation_id: conversationId,
          event_type: "call_answered",
          event_data: {
            call_type: video ? "video" : "voice",
            session_id: incomingCall?.message?.session_id
          }
        });
      } catch (err: any) {
        console.error("[WebRTC] Answer call error:", {
          error: err,
          message: err?.message,
          stack: err?.stack,
          incomingCallState: incomingCall
        });
        toast({ title: "Failed to answer call", variant: "destructive" });
        setCallState("idle");

        // Log analytics for error
        await supabase.from("call_analytics").insert({
          conversation_id: conversationId,
          event_type: "call_answer_failed",
          error_message: err?.message || String(err),
          event_data: {
            call_type: video ? "video" : "voice",
            session_id: incomingCall?.message?.session_id
          }
        });
      }
    },
    [incomingCall, requestMicrophoneForCall, requestVideoCallPermissions, toast, conversationId]
  );

  const declineCall = useCallback(async () => {
    const mgr = managerRef.current;
    if (!mgr || !incomingCall) return;

    // Clear incoming call timeout
    if (incomingCallTimeoutRef.current) {
      clearTimeout(incomingCallTimeoutRef.current);
      incomingCallTimeoutRef.current = null;
    }

    try {
      await mgr.declineCall(incomingCall);
    } finally {
      setIncomingCall(null);
      setCallState("idle");
    }
  }, [incomingCall]);

  const endCall = useCallback(async () => {
    const mgr = managerRef.current;
    if (!mgr) return;

    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    try {
      await mgr.endCall();
    } finally {
      setCallState("ended");
      setIsInCall(false);
      setTimeout(() => setCallState("idle"), 600);
    }
  }, []);

  const toggleAudio = useCallback(() => {
    managerRef.current?.toggleAudio();
  }, []);

  const toggleVideo = useCallback(() => {
    managerRef.current?.toggleVideo();
  }, []);

  const switchCamera = useCallback(() => {
    managerRef.current?.switchCamera();
  }, []);

  const getConnectionStats = useCallback(() => {
    return managerRef.current?.getConnectionStats();
  }, []);

  return {
    callState,
    incomingCall,
    isInCall,
    isVideoCall,
    localStream,
    remoteStream,

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
}
