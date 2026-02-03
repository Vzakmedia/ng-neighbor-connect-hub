import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { CallService, CallServiceState } from "@/utils/call/CallService";
import { useAuth } from "@/hooks/useAuth";
import { VideoCallDialog } from "@/components/messaging/VideoCallDialog";
import { IncomingCallDialog } from "@/components/messaging/IncomingCallDialog";

interface CallContextType extends CallServiceState {
    startVoiceCall: (conversationId: string, otherUserName: string, otherUserAvatar?: string, otherUserId?: string) => Promise<void>;
    startVideoCall: (conversationId: string, otherUserName: string, otherUserAvatar?: string, otherUserId?: string) => Promise<void>;
    answerCall: (video: boolean) => Promise<void>;
    declineCall: () => Promise<void>;
    endCall: () => Promise<void>;
    toggleAudio: () => void;
    toggleVideo: () => void;
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

    useEffect(() => {
        if (user?.id) {
            CallService.getInstance().initialize(user.id);
        }
    }, [user?.id]);

    useEffect(() => {
        const unsubscribe = CallService.getInstance().subscribe((state) => {
            setCallServiceState(state);
        });
        return () => unsubscribe();
    }, []);

    const startVoiceCall = useCallback(async (conversationId: string, name: string, avatar?: string, userId?: string) => {
        if (!userId) {
            console.error("Cannot start call: recipient ID missing");
            return;
        }
        await CallService.getInstance().startCall(conversationId, { id: userId, name, avatar }, "voice");
    }, []);

    const startVideoCall = useCallback(async (conversationId: string, name: string, avatar?: string, userId?: string) => {
        if (!userId) {
            console.error("Cannot start call: recipient ID missing");
            return;
        }
        await CallService.getInstance().startCall(conversationId, { id: userId, name, avatar }, "video");
    }, []);

    const value: CallContextType = {
        ...callServiceState,
        isInCall: callServiceState.state !== "idle" && callServiceState.state !== "ended",
        startVoiceCall,
        startVideoCall,
        answerCall: (video) => CallService.getInstance().answerCall(video),
        declineCall: () => CallService.getInstance().declineCall(),
        endCall: () => CallService.getInstance().endCall(),
        toggleAudio: () => CallService.getInstance().toggleAudio(),
        toggleVideo: () => CallService.getInstance().toggleVideo(),
        switchCamera: () => CallService.getInstance().switchCamera(),
    };

    return (
        <CallContext.Provider value={value}>
            {children}

            <VideoCallDialog
                open={value.isInCall && callServiceState.state !== "ringing"}
                onOpenChange={(open) => { if (!open && value.state === "connected") /* Allow minimize? For now just stay open */ { } }}
                localStream={callServiceState.localStream}
                remoteStream={callServiceState.remoteStream}
                onEndCall={value.endCall}
                onToggleAudio={value.toggleAudio}
                onToggleVideo={value.toggleVideo}
                onSwitchCamera={value.switchCamera}
                isVideoCall={callServiceState.isVideo}
                otherUserName={callServiceState.otherUser?.name || "Unknown User"}
                otherUserAvatar={callServiceState.otherUser?.avatar}
                callState={callServiceState.state as any}
            />

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
