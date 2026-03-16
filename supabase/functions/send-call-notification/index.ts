import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  assertSelfOrPrivileged,
  getRequestContext,
  isPrivilegedUser,
} from "../_shared/auth.ts";
import { sendFcmMessage } from "../_shared/fcm.ts";
import { getClientIp, handleCors, jsonResponse } from "../_shared/http.ts";
import { enforceRateLimit } from "../_shared/rate-limit.ts";

interface CallNotificationRequest {
  recipientId: string;
  callerId: string;
  callerName?: string;
  callType: "audio" | "video";
  conversationId: string;
}

function getStatusCode(message: string): number {
  if (message === "Unauthorized") return 401;
  if (message === "Forbidden") return 403;
  if (message === "Rate limit exceeded") return 429;
  if (message.startsWith("Missing required") || message.startsWith("Invalid")) return 400;
  if (message === "Conversation not found" || message === "Recipient not found") return 404;
  return 500;
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    const context = await getRequestContext(req, { allowInternal: true, requireUser: false });
    const { recipientId, callerId, callerName, callType, conversationId } =
      await req.json() as CallNotificationRequest;

    if (!recipientId || !callerId || !callType || !conversationId) {
      throw new Error("Missing required fields");
    }

    if (!["audio", "video"].includes(callType)) {
      throw new Error("Invalid call type");
    }

    if (!context.isInternal) {
      if (!context.user) {
        throw new Error("Unauthorized");
      }

      await enforceRateLimit({
        admin: context.admin,
        action: "send-call-notification",
        scope: `user:${context.user.id}`,
        limit: isPrivilegedUser(context.roles) ? 60 : 20,
        windowMinutes: 10,
      });

      assertSelfOrPrivileged(context.user.id, callerId, context.roles);
    } else {
      await enforceRateLimit({
        admin: context.admin,
        action: "send-call-notification-internal",
        scope: `ip:${getClientIp(req)}`,
        limit: 150,
        windowMinutes: 5,
      });
    }

    const { data: conversation, error: conversationError } = await context.admin
      .from("direct_conversations")
      .select("user1_id, user2_id")
      .eq("id", conversationId)
      .single();

    if (conversationError || !conversation) {
      throw new Error("Conversation not found");
    }

    const participants = new Set([conversation.user1_id, conversation.user2_id]);
    if (!participants.has(callerId) || !participants.has(recipientId) || callerId === recipientId) {
      throw new Error("Forbidden");
    }

    const [{ data: recipientProfile }, { data: callerProfile }] = await Promise.all([
      context.admin
        .from("profiles")
        .select("fcm_token, apns_token, push_subscription")
        .eq("user_id", recipientId)
        .maybeSingle(),
      context.admin
        .from("profiles")
        .select("full_name")
        .eq("user_id", callerId)
        .maybeSingle(),
    ]);

    if (!recipientProfile) {
      throw new Error("Recipient not found");
    }

    const resolvedCallerName = callerProfile?.full_name || callerName || "Someone";
    const token = recipientProfile.push_subscription || recipientProfile.fcm_token || recipientProfile.apns_token;

    let fcmSent = false;
    if (token) {
      const fcmResponse = await sendFcmMessage(token, {
        title: `Incoming ${callType} call`,
        body: `${resolvedCallerName} is calling you`,
        data: {
          notification_type: "call_incoming",
          conversation_id: conversationId,
          caller_id: callerId,
          caller_name: resolvedCallerName,
          call_type: callType,
          is_background_call: "true",
        },
        priority: "high",
        channelId: "incoming_calls",
        category: "INCOMING_CALL",
      });

      fcmSent = fcmResponse.ok;
      if (!fcmResponse.ok) {
        console.error("Call notification FCM delivery failed:", fcmResponse.result);
      }
    }

    await context.admin.from("alert_notifications").insert({
      recipient_id: recipientId,
      notification_type: "call_incoming",
      content: `${resolvedCallerName} is calling you`,
      notification_metadata: {
        caller_id: callerId,
        caller_name: resolvedCallerName,
        call_type: callType,
        conversation_id: conversationId,
      },
    } as any);

    return jsonResponse(req, {
      success: true,
      message: "Call notification processed",
      fcmSent,
    });
  } catch (error) {
    console.error("Error sending call notification:", error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = getStatusCode(message);

    return jsonResponse(
      req,
      { error: status >= 500 ? "Request failed" : message },
      status,
    );
  }
});
