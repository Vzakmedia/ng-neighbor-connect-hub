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

  // Init manager
  useEffect(() => {
    if (managerRef.current) return;

    const mgr = new WebRTCManagerV2(conversationId);
    managerRef.current = mgr;

    mgr.onIncomingCall = (callData) => {
      setIncomingCall(callData);
      setCallState("ringing");
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
    const subscription = createSafeSubscription(
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
            if (processedSignalIds.current.has(payload.new.id)) return;
            processedSignalIds.current.add(payload.new.id);
            managerRef.current?.handleSignalingMessage(payload.new);
          }
        ),
      {
        channelName: `webrtc-signaling-${conversationId}`,
        pollInterval: 2000,
        debugName: "WebRTC-Signaling",
        onError: () => {
          console.log("[WebRTC] WebSocket failed, falling back to polling");
          pollSignalingMessages();
        },
      }
    );

    return () => {
      cleanupSafeSubscription(subscription);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [conversationId, pollSignalingMessages]);

  const startVoiceCall = useCallback(async () => {
    const mgr = managerRef.current;
    if (!mgr) return;

    const ok = await requestMicrophoneForCall();
    if (!ok) return;

    setIsVideoCall(false);
    setCallState("initiating");

    // Start polling as backup
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    pollingIntervalRef.current = setInterval(pollSignalingMessages, 2000);

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
    pollingIntervalRef.current = setInterval(pollSignalingMessages, 2000);

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
      if (!mgr || !incomingCall) return;

      const ok = video ? await requestVideoCallPermissions() : await requestMicrophoneForCall();
      if (!ok) return;

      setIsVideoCall(video);
      setCallState("connecting");

      try {
        await mgr.answerCall(incomingCall, video ? "video" : "voice");
        setIncomingCall(null);
      } catch (err) {
        console.error("Answer call error", err);
        toast({ title: "Failed to answer call", variant: "destructive" });
        setCallState("idle");
      }
    },
    [incomingCall, requestMicrophoneForCall, requestVideoCallPermissions, toast]
  );

  const declineCall = useCallback(async () => {
    const mgr = managerRef.current;
    if (!mgr || !incomingCall) return;

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
