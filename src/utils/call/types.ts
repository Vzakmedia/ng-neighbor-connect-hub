export type CallType = "voice" | "video";
export type CallState = "idle" | "calling" | "initiating" | "ringing" | "connecting" | "connected" | "ended";

export interface CallParticipant {
    id: string;
    name: string;
    avatar?: string;
}

export interface SignalingMessage {
    id: string;
    type: string;
    sender_id: string;
    receiver_id: string;
    conversation_id: string;
    session_id: string;
    timestamp: string;
    message: any;
}

export interface CallInfo {
    conversationId: string;
    sessionId: string;
    type: CallType;
    participants: {
        caller: CallParticipant;
        receiver: CallParticipant;
    };
    startedAt: string;
}
