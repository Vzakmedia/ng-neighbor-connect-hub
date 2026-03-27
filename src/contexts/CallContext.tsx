import React, { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from "react";
import { CallService, CallServiceState } from "@/utils/call/CallService";
import { useAuth } from "@/hooks/useAuth";
import { useLiveKitToken } from "@/hooks/useLiveKitToken";
import { VideoCallDialog } from "@/components/messaging/VideoCallDialog";
import { VoiceCallCard } from "@/components/messaging/VoiceCallCard";
import { IncomingCallDialog } from "@/components/messaging/IncomingCallDialog";
import type { CallState } from "@/hooks/messaging/useWebRTCCall";

interface CallContextType extends CallServiceState {
    startVoiceCall: (conversationId: string, otherUserName: string, otherUserAvatar?: string, otherUserId?: string) => Promise<void>;
    startVideoCall: (conversationId: string, otherUserName: string, otherUserAvatar?: string, otherUserId?: string) => Promise<void>;
    answerCall: (video: boolean) => Promise<void>;
    declineCall: () => Promise<void>;
    endCall: () => Promise<void>;
    toggleAudio: () => void;
    toggleVideo: () => void;
    toggleSpeaker: (enabled: boolean) => void;
    switchCamera: () => void;
    isInCall: boolean;
}

const CallContext = createContext<CallContextType | null>(null);

export const useCallContext = () => {
    const context = useContext(CallContext);
    if (!context) {
        throw new Error("useCallContext must be used within CallProvider");
    }
    return context;
};

export const CallProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const [callServiceState, setCallServiceState] = useState<CallServiceState>(
        CallService.getInstance().getState()
    );
    const { fetchToken, token: liveKitToken } = useLiveKitToken();

    // Stable refs so the OS-notification event handlers always call the latest callbacks
    const answerCallRef = useRef<(video: boolean) => Promise<void>>(async () => {});
    const declineCallRef = useRef<() => Promise<void>>(async () => {});

    useEffect(() => {
        if (user?.id) {
            CallService.getInstance().initialize(user.id);
        }
    }, [user?.id]);

    // Handle accept/decline events dispatched from the OS notification banner
    useEffect(() => {
        const handleAccept = (e: Event) => {
            const { isVideo } = (e as CustomEvent).detail as { isVideo: boolean };
            answerCallRef.current(isVideo).catch(console.error);
        };
        const handleDecline = () => {
            declineCallRef.current().catch(console.error);
        };
        window.addEventListener('accept-call', handleAccept);
        window.addEventListener('decline-call', handleDecline);
        return () => {
            window.removeEventListener('accept-call', handleAccept);
            window.removeEventListener('decline-call', handleDecline);
        };
    }, []);

    useEffect(() => {
        const unsubscribe = CallService.getInstance().subscribe((state) => {
            setCallServiceState(state);
        });
        return () => { unsubscribe(); };
    }, []);

    const startVoiceCall = useCallback(async (conversationId: string, name: string, avatar?: string, userId?: string) => {
        if (!userId) {
            console.error("Cannot start call: recipient ID missing");
            return;
        }
        await CallService.getInstance().startCall(conversationId, { id: userId, name, avatar }, "voice");
        // Check if we found a conversationId (roomName)
        if (conversationId) {
            const token = await fetchToken(conversationId, user?.user_metadata?.full_name);
            console.log("LiveKit Voice Token fetched:", !!token);
        }
    }, [fetchToken, user]);

    const startVideoCall = useCallback(async (conversationId: string, name: string, avatar?: string, userId?: string) => {
        if (!userId) {
            console.error("Cannot start call: recipient ID missing");
            return;
        }
        await CallService.getInstance().startCall(conversationId, { id: userId, name, avatar }, "video");
        if (conversationId) {
            const token = await fetchToken(conversationId, user?.user_metadata?.full_name);
            console.log("LiveKit Video Token fetched:", !!token);
        }
    }, [fetchToken, user]);

    const answerCallFn = useCallback(async (video: boolean) => {
        await CallService.getInstance().answerCall(video);
        const freshState = CallService.getInstance().getState();
        if (freshState.conversationId) {
            await fetchToken(freshState.conversationId, user?.user_metadata?.full_name);
        }
    }, [fetchToken, user]);

    const declineCallFn = useCallback(() => CallService.getInstance().declineCall(), []);

    // Keep refs in sync with latest callbacks so the OS-notification handlers use them
    answerCallRef.current = answerCallFn;
    declineCallRef.current = declineCallFn;

    const value: CallContextType = {
        ...callServiceState,
        isInCall: callServiceState.state !== "idle" && callServiceState.state !== "ended",
        startVoiceCall,
        startVideoCall,
        answerCall: answerCallFn,
        declineCall: declineCallFn,
        endCall: () => CallService.getInstance().endCall(),
        toggleAudio: () => CallService.getInstance().toggleAudio(),
        toggleVideo: () => CallService.getInstance().toggleVideo(),
        toggleSpeaker: (enabled) => CallService.getInstance().toggleSpeaker(enabled),
        switchCamera: () => CallService.getInstance().switchCamera(),
    };

    return (
        <CallContext.Provider value={value}>
            {children}

            {callServiceState.isVideo ? (
                <VideoCallDialog
                    open={value.isInCall && callServiceState.state !== "ringing"}
                    onOpenChange={() => {}}
                    localStream={callServiceState.localStream}
                    remoteStream={callServiceState.remoteStream}
                    onEndCall={value.endCall}
                    onToggleAudio={value.toggleAudio}
                    onToggleVideo={value.toggleVideo}
                    onToggleSpeaker={value.toggleSpeaker}
                    onSwitchCamera={value.switchCamera}
                    isVideoCall={true}
                    otherUserName={callServiceState.otherUser?.name || "Unknown User"}
                    otherUserAvatar={callServiceState.otherUser?.avatar}
                    callState={callServiceState.state as CallState}
                    liveKitToken={liveKitToken}
                />
            ) : (
                <VoiceCallCard
                    open={value.isInCall && callServiceState.state !== "ringing"}
                    callState={callServiceState.state as CallState}
                    otherUserName={callServiceState.otherUser?.name || "Unknown User"}
                    otherUserAvatar={callServiceState.otherUser?.avatar}
                    localUserName={user?.user_metadata?.full_name || "You"}
                    liveKitToken={liveKitToken}
                    serverUrl={import.meta.env.VITE_LIVEKIT_URL || "wss://neighborlink-94uewje2.livekit.cloud"}
                    onEndCall={value.endCall}
                    onToggleAudio={value.toggleAudio}
                />
            )}

            <IncomingCallDialog
                open={callServiceState.state === "ringing" && !!callServiceState.otherUser}
                callerName={callServiceState.otherUser?.name || "Someone"}
                callerAvatar={callServiceState.otherUser?.avatar}
                isVideoCall={callServiceState.isVideo}
                onAccept={(video) => value.answerCall(video)}
                onDecline={value.declineCall}
            />
        </CallContext.Provider>
    );
};
