import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getRequestContext, isPrivilegedUser } from "../_shared/auth.ts";
import { getClientIp, handleCors, jsonResponse } from "../_shared/http.ts";
import { enforceRateLimit } from "../_shared/rate-limit.ts";

interface LogCallEventRequest {
  log_id?: string;
  caller_id?: string;
  receiver_id?: string;
  conversation_id?: string;
  call_type?: string;
  status?: string;
  started_at?: string;
  connected_at?: string;
  ended_at?: string;
}

function getStatusCode(message: string): number {
  if (message === "Unauthorized") return 401;
  if (message === "Forbidden") return 403;
  if (message === "Rate limit exceeded") return 429;
  if (message.startsWith("Missing required") || message.startsWith("Invalid")) return 400;
  if (message === "Call log not found" || message === "Conversation not found") return 404;
  return 500;
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    const context = await getRequestContext(req, { allowInternal: true, requireUser: false });
    const body = await req.json() as LogCallEventRequest;

    if (!body.status) {
      throw new Error("Missing required fields");
    }

    if (!context.isInternal) {
      if (!context.user) {
        throw new Error("Unauthorized");
      }

      await enforceRateLimit({
        admin: context.admin,
        action: "log-call-event",
        scope: `user:${context.user.id}`,
        limit: isPrivilegedUser(context.roles) ? 120 : 60,
        windowMinutes: 10,
      });
    } else {
      await enforceRateLimit({
        admin: context.admin,
        action: "log-call-event-internal",
        scope: `ip:${getClientIp(req)}`,
        limit: 300,
        windowMinutes: 5,
      });
    }

    let durationSeconds = 0;
    if (body.connected_at && body.ended_at) {
      const connectedTime = new Date(body.connected_at).getTime();
      const endedTime = new Date(body.ended_at).getTime();
      durationSeconds = Math.max(0, Math.floor((endedTime - connectedTime) / 1000));
    }

    if (body.log_id) {
      const { data: existingLog, error: fetchError } = await context.admin
        .from("call_logs")
        .select("id, caller_id, receiver_id")
        .eq("id", body.log_id)
        .single();

      if (fetchError || !existingLog) {
        throw new Error("Call log not found");
      }

      if (
        !context.isInternal &&
        !isPrivilegedUser(context.roles) &&
        context.user?.id !== existingLog.caller_id &&
        context.user?.id !== existingLog.receiver_id
      ) {
        throw new Error("Forbidden");
      }

      const { data, error } = await context.admin
        .from("call_logs")
        .update({
          call_status: body.status,
          connected_at: body.connected_at || undefined,
          ended_at: body.ended_at || undefined,
          duration_seconds: durationSeconds,
        })
        .eq("id", body.log_id)
        .select()
        .single();

      if (error || !data) {
        throw new Error("Failed to update call log");
      }

      return jsonResponse(req, { success: true, log_id: data.id });
    }

    if (!body.caller_id || !body.receiver_id || !body.conversation_id || !body.call_type) {
      throw new Error("Missing required fields");
    }

    if (
      !context.isInternal &&
      !isPrivilegedUser(context.roles) &&
      context.user?.id !== body.caller_id
    ) {
      throw new Error("Forbidden");
    }

    const { data: conversation, error: conversationError } = await context.admin
      .from("direct_conversations")
      .select("user1_id, user2_id")
      .eq("id", body.conversation_id)
      .single();

    if (conversationError || !conversation) {
      throw new Error("Conversation not found");
    }

    const participants = new Set([conversation.user1_id, conversation.user2_id]);
    if (!participants.has(body.caller_id) || !participants.has(body.receiver_id)) {
      throw new Error("Forbidden");
    }

    const { data, error } = await context.admin
      .from("call_logs")
      .insert({
        caller_id: body.caller_id,
        receiver_id: body.receiver_id,
        conversation_id: body.conversation_id,
        call_type: body.call_type,
        call_status: body.status,
        started_at: body.started_at || new Date().toISOString(),
        connected_at: body.connected_at || null,
        ended_at: body.ended_at || null,
        duration_seconds: durationSeconds,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error("Failed to create call log");
    }

    return jsonResponse(req, { success: true, log_id: data.id });
  } catch (error) {
    console.error("Unexpected error:", error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = getStatusCode(message);

    return jsonResponse(
      req,
      { error: status >= 500 ? "Request failed" : message },
      status,
    );
  }
});
