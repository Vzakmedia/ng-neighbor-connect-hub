import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  assertSelfOrPrivileged,
  getRequestContext,
  isPrivilegedUser,
} from "../_shared/auth.ts";
import { sendFcmMessage } from "../_shared/fcm.ts";
import { getClientIp, handleCors, jsonResponse } from "../_shared/http.ts";
import { enforceRateLimit } from "../_shared/rate-limit.ts";

interface PushRequest {
  userId?: string;
  user_id?: string;
  title: string;
  message: string;
  type?: string;
  priority?: "normal" | "high";
  data?: Record<string, unknown>;
}

function getStatusCode(message: string): number {
  if (message === "Unauthorized") return 401;
  if (message === "Forbidden") return 403;
  if (message === "Rate limit exceeded") return 429;
  if (message.startsWith("Missing required") || message.startsWith("Invalid")) return 400;
  return 500;
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    const context = await getRequestContext(req, { allowInternal: true, requireUser: false });
    const requestBody = await req.json() as PushRequest;
    const userId = requestBody.userId ?? requestBody.user_id;
    let priority = requestBody.priority ?? "normal";
    const type = requestBody.type ?? "notification";
    const data = requestBody.data ?? {};

    if (!userId || !requestBody.title || !requestBody.message) {
      throw new Error("Missing required fields: userId, title, message");
    }

    if (requestBody.title.length > 200 || requestBody.message.length > 1000) {
      throw new Error("Invalid push notification length");
    }

    if (!context.isInternal) {
      if (!context.user) {
        throw new Error("Unauthorized");
      }

      await enforceRateLimit({
        admin: context.admin,
        action: "send-push-notification",
        scope: `user:${context.user.id}`,
        limit: isPrivilegedUser(context.roles) ? 40 : 15,
        windowMinutes: 15,
      });

      assertSelfOrPrivileged(context.user.id, userId, context.roles);
    } else {
      await enforceRateLimit({
        admin: context.admin,
        action: "send-push-notification-internal",
        scope: `ip:${getClientIp(req)}`,
        limit: 150,
        windowMinutes: 5,
      });
    }

    const { data: pushConfig } = await context.admin
      .from("app_configuration")
      .select("config_value")
      .eq("config_key", "push_notifications_enabled")
      .single();

    if (!pushConfig?.config_value) {
      return jsonResponse(req, { status: "disabled", error: "Push notifications are disabled" }, 400);
    }

    const [{ data: profile }, { data: prefs }] = await Promise.all([
      context.admin
        .from("profiles")
        .select("push_subscription, fcm_token, apns_token")
        .eq("user_id", userId)
        .maybeSingle(),
      context.admin
        .from("notification_preferences")
        .select("push_enabled")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

    if (prefs && prefs.push_enabled === false) {
      return jsonResponse(req, { status: "skipped", reason: "user_disabled" });
    }

    if (type === "emergency") {
      const { data: emergencyConfig } = await context.admin
        .from("app_configuration")
        .select("config_value")
        .eq("config_key", "emergency_push_priority")
        .single();

      if (emergencyConfig?.config_value) {
        priority = "high";
      }
    }

    await context.admin
      .from("alert_notifications")
      .insert({
        recipient_id: userId,
        notification_type: type,
        content: requestBody.message,
        title: requestBody.title,
        priority,
        data,
        delivery_method: "push",
        sent_at: new Date().toISOString(),
      } as any);

    const token = profile?.push_subscription || profile?.fcm_token || profile?.apns_token;
    if (!token) {
      return jsonResponse(req, {
        success: false,
        status: "no_subscription",
        message: "No push subscription available",
      });
    }

    const fcmResponse = await sendFcmMessage(token, {
      title: requestBody.title,
      body: requestBody.message,
      data: {
        ...data,
        notification_type: type,
        type,
      },
      priority,
      channelId: type === "emergency" ? "emergency" : "default",
      category: type === "emergency" ? "EMERGENCY" : "NOTIFICATION",
    });

    if (!fcmResponse.ok) {
      console.error("FCM push delivery failed:", fcmResponse.result);
    }

    return jsonResponse(req, {
      success: fcmResponse.ok,
      message: fcmResponse.ok
        ? "Push notification sent successfully"
        : "Push delivery failed or was skipped",
      recipient: userId,
      sentAt: new Date().toISOString(),
      provider: "fcm",
    });
  } catch (error) {
    console.error("Error sending push notification:", error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = getStatusCode(message);

    return jsonResponse(
      req,
      {
        error: status >= 500 ? "Request failed" : message,
        status: "error",
      },
      status,
    );
  }
});
