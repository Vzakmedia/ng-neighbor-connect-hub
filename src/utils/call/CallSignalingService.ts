import { supabase } from "@/integrations/supabase/client";
import { createSafeSubscription, cleanupSafeSubscription } from "@/utils/realtimeUtils";

export class CallSignalingService {
    private subscription: any = null;
    private processedSignalIds = new Set<string>();
    private onMessage: (message: any) => void;
    private receiverId: string;

    constructor(receiverId: string, onMessage: (message: any) => void) {
        this.receiverId = receiverId;
        this.onMessage = onMessage;
    }

    async startListening() {
        if (this.subscription) return;

        this.subscription = createSafeSubscription(
            (channel) =>
                channel.on(
                    "postgres_changes",
                    {
                        event: "INSERT",
                        schema: "public",
                        table: "call_signaling",
                        filter: `receiver_id=eq.${this.receiverId}`,
                    },
                    (payload) => {
                        if (!payload?.new?.id) return;
                        this.handleIncomingSignal(payload.new);
                    }
                ),
            {
                channelName: `call-signaling-${this.receiverId}`,
                pollInterval: 2000,
                debugName: "CallSignalingService",
            }
        );

        // Initial poll for any missed signals
        this.poll();
    }

    async poll(conversationId?: string) {
        const query = supabase
            .from("call_signaling")
            .select("*")
            .eq("receiver_id", this.receiverId)
            .gte("created_at", new Date(Date.now() - 60000).toISOString())
            .order("created_at", { ascending: true });

        if (conversationId) {
            query.eq("conversation_id", conversationId);
        }

        const { data: signals } = await query;

        if (signals) {
            signals.forEach((signal) => this.handleIncomingSignal(signal));
        }
    }

    private handleIncomingSignal(signal: any) {
        if (this.processedSignalIds.has(signal.id)) return;
        this.processedSignalIds.add(signal.id);
        this.onMessage(signal);
    }

    async sendSignal(conversationId: string, receiverId: string, sessionId: string, message: any): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const fullMessage = {
            ...message,
            id: crypto.randomUUID(),
            sender_id: user.id,
            conversation_id: conversationId,
            receiver_id: receiverId,
            session_id: sessionId,
            timestamp: new Date().toISOString()
        };

        const { error } = await supabase.functions.invoke("insert-call-signal", {
            body: {
                message: fullMessage,
                conversation_id: conversationId,
                receiver_id: receiverId,
                session_id: sessionId
            }
        });

        if (error) throw error;
    }

    stopListening() {
        if (this.subscription) {
            cleanupSafeSubscription(this.subscription);
            this.subscription = null;
        }
        this.processedSignalIds.clear();
    }
}
