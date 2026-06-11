import { supabase } from "@/integrations/supabase/client";
import { NativeCallManager } from "@/utils/NativeCallManager";
import { CallSignalingService } from "./CallSignalingService";
import { CallState, CallType, SignalingMessage, CallParticipant } from "./types";
import { toast } from "sonner";

export interface CallServiceState {
    state: CallState;
    otherUser: CallParticipant | null;
    isVideo: boolean;
    conversationId: string | null;
    sessionId: string | null;
    isCaller: boolean;
}

const RING_TIMEOUT_MS = 45000;
const RECONNECT_GRACE_MS = 15000;

type CallLogStatus = "missed" | "answered" | "declined" | "failed" | "ended";

/**
 * Call orchestration on top of LiveKit.
 *
 * Media (audio/video) flows exclusively through LiveKit rooms — there is no
 * peer-to-peer WebRTC here. Supabase `call_signaling` is only used for call
 * setup: ring (offer), answer, decline, and end. Connection state is driven
 * by LiveKit room events bridged in via the onRemote... / onRoom... methods.
 */
export class CallService {
    private static instance: CallService;
    private signaling: CallSignalingService | null = null;

    private curState: CallState = "idle";
    private currentSessionId: string | null = null;
    private activeConversationId: string | null = null;
    private otherUser: CallParticipant | null = null;
    private isVideo: boolean = false;
    private isCaller: boolean = false;

    private listeners: Set<(state: CallServiceState) => void> = new Set();
    private callLogId: string | null = null;
    private connectedAt: string | null = null;
    private currentUserId: string | null = null;
    private ringTimeout: ReturnType<typeof setTimeout> | null = null;
    private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    private constructor() { }

    static getInstance(): CallService {
        if (!CallService.instance) {
            CallService.instance = new CallService();
        }
        return CallService.instance;
    }

    async initialize(userId: string) {
        if (this.signaling && this.currentUserId === userId) return;
        // User changed (e.g. sign-out then sign-in as someone else) — reset first
        if (this.signaling) this.shutdown();

        this.currentUserId = userId;
        this.signaling = new CallSignalingService(userId, (msg) => this.handleSignal(msg));
        await this.signaling.startListening();
        console.log("[CallService] Initialized for user:", userId);
    }

    /**
     * Full teardown on sign-out: ends any active call, stops listening for
     * signals, and forgets the user so no call activity survives the session.
     */
    shutdown() {
        if (this.curState !== "idle") {
            this.endCall().catch(() => { /* best effort on sign-out */ });
        }
        this.signaling?.stopListening();
        this.signaling = null;
        this.currentUserId = null;
        console.log("[CallService] Shut down");
    }

    // --- External Actions ---

    async startCall(conversationId: string, otherUser: CallParticipant, type: CallType, callerName?: string) {
        if (this.curState !== "idle") return;
        if (!this.currentUserId || !this.signaling) {
            toast.error("You must be signed in to make calls");
            return;
        }

        this.activeConversationId = conversationId;
        this.otherUser = otherUser;
        this.isVideo = type === "video";
        this.isCaller = true;
        this.currentSessionId = crypto.randomUUID();
        this.setState("initiating");

        try {
            // Log first so the receiver's chat shows the call even if they miss it
            await this.createCallLog(type);
            NativeCallManager.sendCall(otherUser.name, conversationId);

            await this.signaling.sendSignal(conversationId, otherUser.id, this.currentSessionId!, {
                type: "offer",
                callType: type,
                session_id: this.currentSessionId,
                callerName: callerName || "Unknown",
            });

            this.setState("calling");

            this.ringTimeout = setTimeout(() => {
                if (this.curState === "initiating" || this.curState === "calling") {
                    console.log("[CallService] Call timeout - no answer");
                    toast.error("No answer from " + otherUser.name);
                    this.finishCall("missed");
                }
            }, RING_TIMEOUT_MS);

        } catch (error) {
            console.error("[CallService] Start call failed:", error);
            toast.error("Could not start the call. Please check your connection.");
            this.updateCallLog("failed").catch(() => { });
            this.cleanup();
        }
    }

    async answerCall(video: boolean) {
        if (this.curState !== "ringing" || !this.activeConversationId || !this.otherUser) return;

        this.isVideo = video;
        this.setState("connecting");

        try {
            await this.signaling?.sendSignal(
                this.activeConversationId,
                this.otherUser.id,
                this.currentSessionId!,
                { type: "answer", session_id: this.currentSessionId }
            );
            NativeCallManager.connectCall();
            // "connected" is set when the caller shows up in the LiveKit room
        } catch (error) {
            console.error("[CallService] Answer failed:", error);
            toast.error("Could not answer the call. Please check your connection.");
            this.cleanup();
        }
    }

    async declineCall() {
        const signalArgs = this.captureSignalArgs();
        this.cleanup();
        if (signalArgs) {
            try {
                await this.signaling?.sendSignal(
                    signalArgs.conversationId,
                    signalArgs.otherUserId,
                    signalArgs.sessionId,
                    { type: "decline", session_id: signalArgs.sessionId }
                );
            } catch (error) {
                console.error("[CallService] Decline signal failed:", error);
            }
        }
    }

    /**
     * Ends the call. Local cleanup ALWAYS happens first — a flaky network
     * must never leave the user stuck in a call they tried to end.
     */
    async endCall() {
        const status: CallLogStatus =
            this.curState === "connected" ? "ended"
                : this.connectedAt ? "ended"
                    : this.isCaller ? "missed"
                        : "declined";
        await this.finishCall(status);
    }

    private async finishCall(status: CallLogStatus) {
        const signalArgs = this.captureSignalArgs();
        const wasCaller = this.isCaller;
        const logId = this.callLogId;
        const connectedAt = this.connectedAt;
        this.cleanup();

        // Only the caller owns the call log row
        if (wasCaller && logId) {
            this.sendCallLogUpdate(logId, status, connectedAt).catch((e) =>
                console.error("[CallService] Call log update failed:", e)
            );
        }

        if (signalArgs) {
            try {
                await this.signaling?.sendSignal(
                    signalArgs.conversationId,
                    signalArgs.otherUserId,
                    signalArgs.sessionId,
                    { type: "end", session_id: signalArgs.sessionId }
                );
            } catch (error) {
                console.error("[CallService] End signal failed (call already ended locally):", error);
            }
        }
    }

    // --- LiveKit room event bridge (called from the call UI) ---

    /** Remote participant joined the LiveKit room — call is live. */
    onRemoteParticipantJoined() {
        if (this.curState === "calling" || this.curState === "connecting" || this.curState === "initiating") {
            this.clearRingTimeout();
            this.clearReconnectTimeout();
            if (!this.connectedAt) {
                this.connectedAt = new Date().toISOString();
                if (this.isCaller) {
                    this.updateCallLog("answered").catch(() => { });
                }
            }
            this.setState("connected");
            NativeCallManager.connectCall();
        } else if (this.curState === "connected") {
            // Remote came back after a drop
            this.clearReconnectTimeout();
        }
    }

    /** Remote participant left the room. Grace period covers brief drops. */
    onRemoteParticipantLeft() {
        if (this.curState !== "connected") return;
        this.setState("connecting");
        this.clearReconnectTimeout();
        this.reconnectTimeout = setTimeout(() => {
            if (this.curState === "connecting") {
                toast.info("Call ended — " + (this.otherUser?.name || "the other person") + " disconnected");
                this.finishCall("ended");
            }
        }, RECONNECT_GRACE_MS);
    }

    /** Our own connection to LiveKit is re-establishing (poor network). */
    onRoomReconnecting() {
        if (this.curState === "connected") {
            this.setState("connecting");
        }
    }

    /** Our connection to LiveKit recovered. */
    onRoomReconnected() {
        if (this.curState === "connecting" && this.connectedAt) {
            this.setState("connected");
        }
    }

    /** LiveKit gave up reconnecting — the call cannot continue. */
    onRoomConnectionLost() {
        if (this.curState === "idle") return;
        toast.error("Call ended — connection lost");
        this.finishCall(this.connectedAt ? "ended" : "failed");
    }

    // --- Signaling Handler ---

    private async handleSignal(signal: SignalingMessage) {
        const { type, session_id } = signal.message;

        if (type === "offer") {
            if (this.curState !== "idle") return; // Busy
            if (!this.currentUserId) return;      // Signed out — ignore

            this.activeConversationId = signal.conversation_id;
            this.currentSessionId = session_id;
            this.isVideo = signal.message.callType === "video";
            this.isCaller = false;
            this.otherUser = { id: signal.sender_id, name: signal.message.callerName || "Someone" };

            this.setState("ringing");
            NativeCallManager.receiveCall(this.otherUser.name, this.activeConversationId);

            // Stop ringing if the caller gives up and the "end" signal gets lost
            this.ringTimeout = setTimeout(() => {
                if (this.curState === "ringing" && this.currentSessionId === session_id) {
                    this.cleanup();
                }
            }, RING_TIMEOUT_MS);
        }
        else if (session_id === this.currentSessionId) {
            if (type === "answer") {
                // Receiver accepted — they are joining the LiveKit room now
                this.clearRingTimeout();
                if (this.curState === "calling" || this.curState === "initiating") {
                    this.setState("connecting");
                }
            }
            else if (type === "decline") {
                if (this.isCaller) {
                    toast.info((this.otherUser?.name || "User") + " declined the call");
                    this.updateCallLog("declined").catch(() => { });
                }
                this.cleanup();
            }
            else if (type === "end") {
                const wasRinging = this.curState === "ringing";
                const wasConnected = this.curState === "connected" || !!this.connectedAt;
                if (this.isCaller && wasConnected) {
                    this.updateCallLog("ended").catch(() => { });
                }
                if (!wasRinging && !wasConnected && this.isCaller) {
                    this.updateCallLog("missed").catch(() => { });
                }
                this.cleanup();
            }
            // "ice" signals from old clients are ignored — media is LiveKit-only
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
            isCaller: this.isCaller,
        };
    }

    // --- Call logging (edge function writes to call_logs) ---

    private async createCallLog(type: CallType) {
        if (!this.currentUserId || !this.otherUser || !this.activeConversationId) return;
        try {
            const { data, error } = await supabase.functions.invoke("log-call-event", {
                body: {
                    caller_id: this.currentUserId,
                    receiver_id: this.otherUser.id,
                    conversation_id: this.activeConversationId,
                    call_type: type,
                    status: "missed", // pessimistic default; updated on answer/end
                    started_at: new Date().toISOString(),
                },
            });
            if (error) throw error;
            this.callLogId = data?.log_id ?? null;
        } catch (error) {
            // Logging must never block the call itself
            console.error("[CallService] Failed to create call log:", error);
        }
    }

    private async updateCallLog(status: CallLogStatus) {
        if (!this.callLogId) return;
        await this.sendCallLogUpdate(this.callLogId, status, this.connectedAt);
    }

    private async sendCallLogUpdate(logId: string, status: CallLogStatus, connectedAt: string | null) {
        const body: Record<string, unknown> = {
            log_id: logId,
            status,
        };
        if (connectedAt) {
            body.connected_at = connectedAt;
        }
        if (status === "ended" || status === "missed" || status === "failed") {
            body.ended_at = new Date().toISOString();
        }
        const { error } = await supabase.functions.invoke("log-call-event", { body });
        if (error) throw error;
    }

    // --- Helpers ---

    private captureSignalArgs() {
        if (!this.activeConversationId || !this.otherUser || !this.currentSessionId) return null;
        return {
            conversationId: this.activeConversationId,
            otherUserId: this.otherUser.id,
            sessionId: this.currentSessionId,
        };
    }

    private clearRingTimeout() {
        if (this.ringTimeout) {
            clearTimeout(this.ringTimeout);
            this.ringTimeout = null;
        }
    }

    private clearReconnectTimeout() {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
    }

    cleanup() {
        this.clearRingTimeout();
        this.clearReconnectTimeout();
        this.curState = "idle";
        this.currentSessionId = null;
        this.activeConversationId = null;
        this.otherUser = null;
        this.isCaller = false;
        this.callLogId = null;
        this.connectedAt = null;
        NativeCallManager.endCall();
        this.notify();
    }
}
