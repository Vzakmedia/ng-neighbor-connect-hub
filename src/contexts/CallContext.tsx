import React, { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from "react";
import { CallService, CallServiceState } from "@/utils/call/CallService";
import { useAuth } from "@/hooks/useAuth";
import { useLiveKitToken } from "@/hooks/useLiveKitToken";
import { VideoCallDialog } from "@/components/messaging/VideoCallDialog";
import { VoiceCallCard } from "@/components/messaging/VoiceCallCard";
import { IncomingCallDialog } from "@/components/messaging/IncomingCallDialog";
import type { CallState } from "@/utils/call/types";

const LIVEKIT_SERVER_URL = import.meta.env.VITE_LIVEKIT_URL || "wss://neighborlink-94uewje2.livekit.cloud";

interface CallContextType extends CallServiceState {
    startVoiceCall: (conversationId: string, otherUserName: string, otherUserAvatar?: string, otherUserId?: string) => Promise<void>;
    startVideoCall: (conversationId: string, otherUserName: string, otherUserAvatar?: string, otherUserId?: string) => Promise<void>;
    answerCall: (video: boolean) => Promise<void>;
    declineCall: () => Promise<void>;
    endCall: () => Promise<void>;
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
    const { fetchToken, token: liveKitToken, clearToken } = useLiveKitToken();

    // Stable refs so the OS-notification event handlers always call the latest callbacks
    const answerCallRef = useRef<(video: boolean) => Promise<void>>(async () => {});
    const declineCallRef = useRef<() => Promise<void>>(async () => {});

    // Initialize signaling when signed in; fully tear down calls on sign-out
    // so no call can outlive the session.
    useEffect(() => {
        if (user?.id) {
            CallService.getInstance().initialize(user.id);
        } else {
            CallService.getInstance().shutdown();
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

    // A stale token would join the previous call's room — clear it once the call ends.
    useEffect(() => {
        if (callServiceState.state === "idle") {
            clearToken();
        }
    }, [callServiceState.state, clearToken]);

    const startVoiceCall = useCallback(async (conversationId: string, name: string, avatar?: string, userId?: string) => {
        if (!user?.id) {
            console.error("Cannot start call: not signed in");
            return;
        }
        if (!userId) {
            console.error("Cannot start call: recipient ID missing");
            return;
        }
        const callerName = user?.user_metadata?.full_name;
        // Fetch LiveKit token concurrently with signaling so the call UI renders
        // with a valid token from the first frame — not after a second async round trip.
        await Promise.all([
            CallService.getInstance().startCall(conversationId, { id: userId, name, avatar }, "voice", callerName),
            fetchToken(conversationId, callerName),
        ]);
    }, [fetchToken, user]);

    const startVideoCall = useCallback(async (conversationId: string, name: string, avatar?: string, userId?: string) => {
        if (!user?.id) {
            console.error("Cannot start call: not signed in");
            return;
        }
        if (!userId) {
            console.error("Cannot start call: recipient ID missing");
            return;
        }
        const callerName = user?.user_metadata?.full_name;
        await Promise.all([
            CallService.getInstance().startCall(conversationId, { id: userId, name, avatar }, "video", callerName),
            fetchToken(conversationId, callerName),
        ]);
    }, [fetchToken, user]);

    const answerCallFn = useCallback(async (video: boolean) => {
        if (!user?.id) return;
        await CallService.getInstance().answerCall(video);
        const freshState = CallService.getInstance().getState();
        if (freshState.conversationId) {
            await fetchToken(freshState.conversationId, user?.user_metadata?.full_name);
        }
    }, [fetchToken, user]);

    const declineCallFn = useCallback(() => CallService.getInstance().declineCall(), []);

    // Keep refs in sync with latest callbacks so the OS-notification handlers use them.
    // Done in useEffect (not in render body) to avoid updating refs mid-render.
    useEffect(() => {
      answerCallRef.current = answerCallFn;
      declineCallRef.current = declineCallFn;
    }, [answerCallFn, declineCallFn]);

    // Bridge LiveKit room events into the call state machine
    const handleRemoteJoined = useCallback(() => CallService.getInstance().onRemoteParticipantJoined(), []);
    const handleRemoteLeft = useCallback(() => CallService.getInstance().onRemoteParticipantLeft(), []);
    const handleConnectionLost = useCallback(() => CallService.getInstance().onRoomConnectionLost(), []);
    const handleReconnecting = useCallback(() => CallService.getInstance().onRoomReconnecting(), []);
    const handleReconnected = useCallback(() => CallService.getInstance().onRoomReconnected(), []);

    const value: CallContextType = {
        ...callServiceState,
        isInCall: callServiceState.state !== "idle" && callServiceState.state !== "ended",
        startVoiceCall,
        startVideoCall,
        answerCall: answerCallFn,
        declineCall: declineCallFn,
        endCall: () => CallService.getInstance().endCall(),
    };

    return (
        <CallContext.Provider value={value}>
            {children}

            {/* Call UI is only available to authenticated users */}
            {user && (
                <>
                    {callServiceState.isVideo ? (
                        <VideoCallDialog
                            open={value.isInCall && callServiceState.state !== "ringing"}
                            onOpenChange={() => {}}
                            onEndCall={value.endCall}
                            otherUserName={callServiceState.otherUser?.name || "Unknown User"}
                            otherUserAvatar={callServiceState.otherUser?.avatar}
                            callState={callServiceState.state as CallState}
                            liveKitToken={liveKitToken}
                            serverUrl={LIVEKIT_SERVER_URL}
                            onRemoteParticipantJoined={handleRemoteJoined}
                            onRemoteParticipantLeft={handleRemoteLeft}
                            onConnectionLost={handleConnectionLost}
                            onReconnecting={handleReconnecting}
                            onReconnected={handleReconnected}
                        />
                    ) : (
                        <VoiceCallCard
                            open={value.isInCall && callServiceState.state !== "ringing"}
                            callState={callServiceState.state as CallState}
                            otherUserName={callServiceState.otherUser?.name || "Unknown User"}
                            otherUserAvatar={callServiceState.otherUser?.avatar}
                            localUserName={user?.user_metadata?.full_name || "You"}
                            liveKitToken={liveKitToken}
                            serverUrl={LIVEKIT_SERVER_URL}
                            onEndCall={value.endCall}
                            onToggleAudio={() => {}}
                            onRemoteParticipantJoined={handleRemoteJoined}
                            onRemoteParticipantLeft={handleRemoteLeft}
                            onConnectionLost={handleConnectionLost}
                            onReconnecting={handleReconnecting}
                            onReconnected={handleReconnected}
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
                </>
            )}
        </CallContext.Provider>
    );
};
