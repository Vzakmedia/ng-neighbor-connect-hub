import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getRequestContext } from "../_shared/auth.ts";
import { handleCors, jsonResponse } from "../_shared/http.ts";
import { enforceRateLimit } from "../_shared/rate-limit.ts";

interface SignalingMessage {
  id: string;
  type: "offer" | "answer" | "ice" | "end" | "restart" | "busy" | "renegotiate" | "renegotiate-answer" | "timeout";
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  session_id?: string;
  sdp?: unknown;
  candidate?: unknown;
  timestamp?: string;
  metadata?: unknown;
}

const validTypes = new Set([
  "offer",
  "answer",
  "ice",
  "ice-candidate",
  "reject",
  "decline",
  "end",
  "restart",
  "busy",
  "renegotiate",
  "renegotiate-answer",
  "timeout",
  "ringing",
]);

function getStatusCode(message: string): number {
  if (message === "Unauthorized") return 401;
  if (message === "Forbidden") return 403;
  if (message === "Rate limit exceeded") return 429;
  if (message === "Conversation not found") return 404;
  if (message.startsWith("Missing") || message.startsWith("Invalid")) return 400;
  return 500;
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    const context = await getRequestContext(req, { allowInternal: false, requireUser: true });
    if (!context.user) {
      throw new Error("Unauthorized");
    }

    await enforceRateLimit({
      admin: context.admin,
      action: "insert-call-signal",
      scope: `user:${context.user.id}`,
      limit: 150,
      windowMinutes: 5,
    });

    const { message, conversation_id, receiver_id, session_id } = await req.json() as {
      message?: Partial<SignalingMessage>;
      conversation_id?: string;
      receiver_id?: string;
      session_id?: string;
    };

    if (!message || !conversation_id || !receiver_id || !message.id || !message.type) {
      throw new Error("Missing required fields");
    }

    if (!validTypes.has(message.type)) {
      throw new Error("Invalid signal type");
    }

    const { data: conversation, error: conversationError } = await context.admin
      .from("direct_conversations")
      .select("user1_id, user2_id")
      .eq("id", conversation_id)
      .maybeSingle();

    if (conversationError || !conversation) {
      throw new Error("Conversation not found");
    }

    const participants = [conversation.user1_id, conversation.user2_id];
    if (!participants.includes(context.user.id) || !participants.includes(receiver_id) || receiver_id === context.user.id) {
      throw new Error("Forbidden");
    }

    const { data: existing, error: checkError } = await context.admin
      .from("call_signaling")
      .select("id")
      .eq("message->>id", message.id)
      .maybeSingle();

    if (checkError) {
      throw new Error("Failed to check existing signal");
    }

    if (existing) {
      return jsonResponse(req, {
        status: "duplicate",
        message: "Message already exists",
        id: existing.id,
      });
    }

    const payload: SignalingMessage = {
      ...message,
      conversation_id,
      receiver_id,
      sender_id: context.user.id,
      session_id: session_id || message.session_id,
    } as SignalingMessage;

    const expiresAt = new Date(Date.now() + 2 * 60 * 1000).toISOString();

    const { data, error: insertError } = await context.admin
      .from("call_signaling")
      .insert({
        conversation_id,
        sender_id: context.user.id,
        receiver_id,
        type: message.type,
        message: payload,
        expires_at: expiresAt,
        session_id: payload.session_id || null,
      })
      .select("id")
      .single();

    if (insertError || !data) {
      throw new Error("Failed to insert message");
    }

    return jsonResponse(req, {
      status: "success",
      message: "Signaling message inserted",
      id: data.id,
    });
  } catch (error) {
    console.error("insert-call-signal error:", error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = getStatusCode(message);

    return jsonResponse(
      req,
      { error: status >= 500 ? "Request failed" : message },
      status,
    );
  }
});
