import React, { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from "react";
import { WebRTCManagerV2 } from "@/utils/webrtcV2";
import { supabase } from "@/integrations/supabase/client";
import { useCallPermissions } from "@/hooks/mobile/useCallPermissions";
import { useToast } from "@/hooks/use-toast";
import { createSafeSubscription, cleanupSafeSubscription } from "@/utils/realtimeUtils";
import { playMessagingChime, sendBrowserNotification } from "@/utils/audioUtils";
import { VideoCallDialog } from "@/components/messaging/VideoCallDialog";
import { IncomingCallDialog } from "@/components/messaging/IncomingCallDialog";
import { useAuth } from "@/hooks/useAuth";

type CallState = "idle" | "initiating" | "ringing" | "connecting" | "connected" | "ended";

interface CallContextType {
    callState: CallState;
    incomingCall: any | null;
    isInCall: boolean;
    isVideoCall: boolean;
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    activeConversationId: string | null;
    otherUser: { name: string; avatar?: string } | null;

    startVoiceCall: (conversationId: string, otherUserName: string, otherUserAvatar?: string) => Promise<void>;
    startVideoCall: (conversationId: string, otherUserName: string, otherUserAvatar?: string) => Promise<void>;
    answerCall: (video: boolean) => Promise<void>;
    declineCall: () => Promise<void>;
    endCall: () => Promise<void>;
    toggleAudio: () => void;
    toggleVideo: () => void;
    switchCamera: () => void;
}

const CallContext = createContext<CallContextType | null>(null);

export const useCallContext = () => {
    const context = useContext(CallContext);
    if (!context) throw new Error("useCallContext must be used within CallProvider");
    return context;
};

export const CallProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const { requestMicrophoneForCall, requestVideoCallPermissions } = useCallPermissions();

    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [otherUser, setOtherUser] = useState<{ name: string; avatar?: string } | null>(null);

    const managerRef = useRef<WebRTCManagerV2 | null>(null);
    const [incomingCall, setIncomingCall] = useState<any | null>(null);
    const [callState, setCallState] = useState<CallState>("idle");
    const [isVideoCall, setIsVideoCall] = useState(false);
    const [isInCall, setIsInCall] = useState(false);

    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

    const processedSignalIds = useRef<Set<string>>(new Set());
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const incomingCallTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const cleanup = useCallback(() => {
        if (managerRef.current) {
            managerRef.current.cleanup();
            managerRef.current = null;
        }
        setCallState("idle");
        setIsInCall(false);
        setLocalStream(null);
        setRemoteStream(null);
        setIncomingCall(null);
        setActiveConversationId(null);
        setOtherUser(null);
        processedSignalIds.current.clear();

        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
    }, []);

    const initManager = useCallback((conversationId: string) => {
        if (managerRef.current && activeConversationId === conversationId) return managerRef.current;

        if (managerRef.current) {
            managerRef.current.cleanup();
        }

        const mgr = new WebRTCManagerV2(conversationId);
        managerRef.current = mgr;
        setActiveConversationId(conversationId);

        mgr.onIncomingCall = async (callData) => {
            // Fetch caller details if not provided
            setIncomingCall(callData);
            setCallState("ringing");

            // Play sound and show browser notification
            await playMessagingChime(undefined, 'double');
            await sendBrowserNotification(`Incoming ${callData.message?.callType || 'voice'} call`, {
                body: "Click to view call",
                tag: 'incoming-call'
            });

            if (incomingCallTimeoutRef.current) {
                clearTimeout(incomingCallTimeoutRef.current);
            }
            incomingCallTimeoutRef.current = setTimeout(() => {
                mgr.declineCall(callData);
                setIncomingCall(null);
                setCallState("idle");
                toast({ title: "Call missed", description: "The call was not answered in time" });
            }, 40000);
        };

        mgr.onCallStateUpdate = (state) => {
            setCallState(state);
            setIsInCall(state === "connected" || state === "connecting" || state === "initiating");
        };

        mgr.onLocalStream = (stream) => setLocalStream(stream);
        mgr.onRemoteStream = (stream) => setRemoteStream(stream);

        return mgr;
    }, [activeConversationId, toast]);

    const pollSignalingMessages = useCallback(async () => {
        const mgr = managerRef.current;
        if (!mgr || !activeConversationId || !user) return;

        const { data: signals } = await supabase
            .from("call_signaling")
            .select("*")
            .eq("conversation_id", activeConversationId)
            .eq("receiver_id", user.id)
            .gte("created_at", new Date(Date.now() - 30000).toISOString())
            .order("created_at", { ascending: true });

        if (signals) {
            signals.forEach((signal) => {
                if (processedSignalIds.current.has(signal.id)) return;
                processedSignalIds.current.add(signal.id);
                mgr.handleSignalingMessage(signal);
            });
        }
    }, [user]);

    // Global listener for incoming calls when idle
    useEffect(() => {
        if (!user) return;

        const subscription = createSafeSubscription(
            (channel) =>
                channel.on(
                    "postgres_changes",
                    {
                        event: "INSERT",
                        schema: "public",
                        table: "call_signaling",
                        filter: `receiver_id=eq.${user.id}`,
                    },
                    (payload) => {
                        if (!payload?.new?.id) return;
                        const signal = payload.new;

                        // If we're idle, start managing this call
                        if (callState === "idle" && signal.message?.type === "offer") {
                            const mgr = initManager(signal.conversation_id);
                            processedSignalIds.current.add(signal.id);
                            mgr.handleSignalingMessage(signal);

                            // Try to find user info from conversation or just use defaults
                            // (In real app, we might fetch user profile here if not in direct metadata)
                        } else if (activeConversationId === signal.conversation_id) {
                            // Current active conversation signal
                            if (processedSignalIds.current.has(signal.id)) return;
                            processedSignalIds.current.add(signal.id);
                            managerRef.current?.handleSignalingMessage(signal);
                        }
                    }
                ),
            {
                channelName: `global-calls-${user.id}`,
                pollInterval: 2000,
                debugName: "Global-Call-Listener",
            }
        );

        return () => {
            cleanupSafeSubscription(subscription);
        };
    }, [user, callState, initManager, activeConversationId]);

    const startVoiceCall = useCallback(async (conversationId: string, name: string, avatar?: string) => {
        const ok = await requestMicrophoneForCall();
        if (!ok) return;

        const mgr = initManager(conversationId);
        setOtherUser({ name, avatar });
        setIsVideoCall(false);
        setCallState("initiating");

        try {
            await mgr.startCall("voice");
        } catch (err) {
            console.error("Start voice call error", err);
            toast({ title: "Failed to start voice call", variant: "destructive" });
            cleanup();
        }
    }, [initManager, requestMicrophoneForCall, toast, cleanup]);

    const startVideoCall = useCallback(async (conversationId: string, name: string, avatar?: string) => {
        const ok = await requestVideoCallPermissions();
        if (!ok) return;

        const mgr = initManager(conversationId);
        setOtherUser({ name, avatar });
        setIsVideoCall(true);
        setCallState("initiating");

        try {
            await mgr.startCall("video");
        } catch (err) {
            console.error("Start video call error", err);
            toast({ title: "Failed to start video call", variant: "destructive" });
            cleanup();
        }
    }, [initManager, requestVideoCallPermissions, toast, cleanup]);

    const answerCall = useCallback(async (video: boolean) => {
        if (!managerRef.current || !incomingCall) return;

        if (incomingCallTimeoutRef.current) {
            clearTimeout(incomingCallTimeoutRef.current);
            incomingCallTimeoutRef.current = null;
        }

        const ok = video ? await requestVideoCallPermissions() : await requestMicrophoneForCall();
        if (!ok) return;

        setIsVideoCall(video);
        setCallState("connecting");

        try {
            await managerRef.current.answerCall(incomingCall, video ? "video" : "voice");
            setIncomingCall(null);
        } catch (err) {
            console.error("Answer call error", err);
            toast({ title: "Failed to answer call", variant: "destructive" });
            cleanup();
        }
    }, [incomingCall, requestMicrophoneForCall, requestVideoCallPermissions, toast, cleanup]);

    const declineCall = useCallback(async () => {
        if (!managerRef.current || !incomingCall) return;
        if (incomingCallTimeoutRef.current) {
            clearTimeout(incomingCallTimeoutRef.current);
            incomingCallTimeoutRef.current = null;
        }

        try {
            await managerRef.current.declineCall(incomingCall);
        } finally {
            cleanup();
        }
    }, [incomingCall, cleanup]);

    const endCall = useCallback(async () => {
        if (!managerRef.current) return;
        try {
            await managerRef.current.endCall();
        } finally {
            cleanup();
        }
    }, [cleanup]);

    const toggleAudio = useCallback(() => managerRef.current?.toggleAudio(), []);
    const toggleVideo = useCallback(() => managerRef.current?.toggleVideo(), []);
    const switchCamera = useCallback(() => managerRef.current?.switchCamera(), []);

    const value: CallContextType = {
        callState,
        incomingCall,
        isInCall,
        isVideoCall,
        localStream,
        remoteStream,
        activeConversationId,
        otherUser,
        startVoiceCall,
        startVideoCall,
        answerCall,
        declineCall,
        endCall,
        toggleAudio,
        toggleVideo,
        switchCamera
    };

    return (
        <CallContext.Provider value={value}>
            {children}

            {/* Global Call UI Components */}
            <VideoCallDialog
                open={isInCall}
                onOpenChange={(open) => { if (!open) setCallState("idle"); }} // Just hide, don't end? Actually might need state for "minimized"
                localStream={localStream}
                remoteStream={remoteStream}
                onEndCall={endCall}
                onToggleAudio={toggleAudio}
                onToggleVideo={toggleVideo}
                onSwitchCamera={switchCamera}
                isVideoCall={isVideoCall}
                otherUserName={otherUser?.name || "Unknown User"}
                otherUserAvatar={otherUser?.avatar}
                callState={callState as any}
            />

            <IncomingCallDialog
                open={!!incomingCall}
                callerName={otherUser?.name || incomingCall?.sender_name || "Someone"}
                callerAvatar={otherUser?.avatar || incomingCall?.sender_avatar}
                isVideoCall={incomingCall?.message?.callType === "video"}
                onAccept={(video) => answerCall(video)}
                onDecline={declineCall}
            />
        </CallContext.Provider>
    );
};
