import { supabase } from "@/integrations/supabase/client";
import { NativeCallManager } from "@/utils/NativeCallManager";
import { CallSignalingService } from "./CallSignalingService";
import { WebRTCManager } from "./WebRTCManager";
import { CallState, CallType, SignalingMessage, CallParticipant } from "./types";
import { toast } from "sonner";

export interface CallServiceState {
    state: CallState;
    otherUser: CallParticipant | null;
    isVideo: boolean;
    conversationId: string | null;
    sessionId: string | null;
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
}

export class CallService {
    private static instance: CallService;
    private manager: WebRTCManager | null = null;
    private signaling: CallSignalingService | null = null;

    private curState: CallState = "idle";
    private currentSessionId: string | null = null;
    private activeConversationId: string | null = null;
    private otherUser: CallParticipant | null = null;
    private isVideo: boolean = false;
    private localStream: MediaStream | null = null;
    private remoteStream: MediaStream | null = null;

    private listeners: Set<(state: CallServiceState) => void> = new Set();
    private callLogId: string | null = null;
    private startTime: number | null = null;
    private currentUserId: string | null = null;
    private pendingOffer: any = null;

    private constructor() { }

    static getInstance(): CallService {
        if (!CallService.instance) {
            CallService.instance = new CallService();
        }
        return CallService.instance;
    }

    async initialize(userId: string) {
        if (this.signaling) return;
        this.currentUserId = userId;
        this.signaling = new CallSignalingService(userId, (msg) => this.handleSignal(msg));
        await this.signaling.startListening();
        console.log("[CallService] Initialized for user:", userId);
    }

    // --- External Actions ---

    async startCall(conversationId: string, otherUser: CallParticipant, type: CallType) {
        if (this.curState !== "idle") return;

        this.activeConversationId = conversationId;
        this.otherUser = otherUser;
        this.isVideo = type === "video";
        this.currentSessionId = crypto.randomUUID();
        this.setState("initiating");

        try {
            this.manager = await this.createManager();
            await this.manager.setup(type, this.currentSessionId!);
            const offer = await this.manager.createOffer();

            await this.createCallLog();
            NativeCallManager.sendCall(otherUser.name, conversationId);

            await this.signaling?.sendSignal(conversationId, otherUser.id, this.currentSessionId!, {
                type: "offer",
                sdp: offer,
                callType: type,
                session_id: this.currentSessionId
            });

            this.setState("ringing");
            this.startTime = Date.now();

            // Ringing timeout
            setTimeout(() => {
                if (this.curState === "ringing" || this.curState === "initiating") {
                    console.log("[CallService] Call timeout - no answer");
                    this.endCall();
                    toast.error("No answer from " + otherUser.name);
                }
            }, 45000);

        } catch (error) {
            console.error("[CallService] Start call failed:", error);
            this.cleanup();
        }
    }

    async answerCall(video: boolean) {
        if (!this.pendingOffer || !this.activeConversationId || !this.otherUser) return;

        this.isVideo = video;
        this.setState("connecting");

        try {
            this.manager = await this.createManager();
            await this.manager.setup(video ? "video" : "voice", this.currentSessionId!);
            const answer = await this.manager.handleOffer(this.pendingOffer.message.sdp);

            await this.signaling?.sendSignal(
                this.activeConversationId,
                this.otherUser.id,
                this.currentSessionId!,
                { type: "answer", sdp: answer, session_id: this.currentSessionId }
            );

            this.pendingOffer = null;
            this.startTime = Date.now();
            NativeCallManager.connectCall();
        } catch (error) {
            console.error("[CallService] Answer failed:", error);
            this.cleanup();
        }
    }

    async declineCall() {
        if (this.activeConversationId && this.otherUser && this.currentSessionId) {
            await this.signaling?.sendSignal(
                this.activeConversationId,
                this.otherUser.id,
                this.currentSessionId,
                { type: "decline", session_id: this.currentSessionId }
            );
        }
        this.cleanup();
    }

    async endCall() {
        if (this.activeConversationId && this.otherUser && this.currentSessionId) {
            await this.signaling?.sendSignal(
                this.activeConversationId,
                this.otherUser.id,
                this.currentSessionId,
                { type: "end", session_id: this.currentSessionId }
            );
        }
        this.cleanup();
    }

    // --- Signaling Handler ---

    private async handleSignal(signal: SignalingMessage) {
        const { type, session_id } = signal.message;

        if (type === "offer") {
            if (this.curState !== "idle") return; // Busy

            this.activeConversationId = signal.conversation_id;
            this.currentSessionId = session_id;
            this.isVideo = signal.message.callType === "video";
            this.pendingOffer = signal;

            // Fetch caller name if possible (or use sender_id)
            this.otherUser = { id: signal.sender_id, name: "Someone" };
            // In real app, might want to fetch profile here or pass it in signal metadata

            this.setState("ringing");
            NativeCallManager.receiveCall(this.otherUser.name, this.activeConversationId);
        }
        else if (session_id === this.currentSessionId) {
            if (type === "answer" && this.manager) {
                await this.manager.handleAnswer(signal.message.sdp);
                this.setState("connected");
                NativeCallManager.connectCall();
            }
            else if (type === "ice" && this.manager) {
                await this.manager.addIceCandidate(signal.message.candidate);
            }
            else if (type === "decline" || type === "end") {
                this.cleanup();
            }
        }
    }

    // --- Subscriptions ---

    subscribe(listener: (state: CallServiceState) => void) {
        this.listeners.add(listener);
        listener(this.getState());
        return () => this.listeners.delete(listener);
    }

    private setState(state: CallState) {
        this.curState = state;
        this.notify();
    }

    private notify() {
        this.listeners.forEach(l => l(this.getState()));
    }

    getState(): CallServiceState {
        return {
            state: this.curState,
            otherUser: this.otherUser,
            isVideo: this.isVideo,
            conversationId: this.activeConversationId,
            sessionId: this.currentSessionId,
            localStream: this.localStream,
            remoteStream: this.remoteStream
        };
    }

    // --- Helpers ---

    private async createManager(): Promise<WebRTCManager> {
        return new WebRTCManager({
            onLocalStream: (s) => { this.localStream = s; this.notify(); },
            onRemoteStream: (s) => { this.remoteStream = s; this.notify(); },
            onStateChange: (s) => this.setState(s),
            onSignal: (msg) => this.signaling?.sendSignal(
                this.activeConversationId!,
                this.otherUser!.id,
                this.currentSessionId!,
                msg
            ),
            onError: (c, m) => {
                console.error(`[WebRTC] ${c}: ${m}`);
                toast.error("Call error: " + m);
                this.cleanup();
            }
        });
    }

    private async createCallLog() {
        // Implement database logging via Edge Function
    }

    cleanup() {
        this.manager?.cleanup();
        this.manager = null;
        this.curState = "idle";
        this.currentSessionId = null;
        this.activeConversationId = null;
        this.otherUser = null;
        this.localStream = null;
        this.remoteStream = null;
        this.pendingOffer = null;
        NativeCallManager.endCall();
        this.notify();
    }

    toggleAudio() { this.manager?.toggleAudio(); }
    toggleVideo() { this.manager?.toggleVideo(); }
    switchCamera() { this.manager?.switchCamera(); }
}
