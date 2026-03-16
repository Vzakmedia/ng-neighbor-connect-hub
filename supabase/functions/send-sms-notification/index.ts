import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  assertSelfOrPrivileged,
  getRequestContext,
  isPrivilegedUser,
} from "../_shared/auth.ts";
import { getClientIp, handleCors, jsonResponse } from "../_shared/http.ts";
import { enforceRateLimit } from "../_shared/rate-limit.ts";

interface SmsRequest {
  to: string;
  body: string;
  userId?: string;
}

function isValidPhone(value: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(value);
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
    const { to, body, userId } = await req.json() as SmsRequest;

    if (!to || !body) {
      throw new Error("Missing required fields: to, body");
    }

    if (!isValidPhone(to)) {
      throw new Error("Invalid phone number");
    }

    if (body.length > 1000) {
      throw new Error("Invalid message length");
    }

    if (!context.isInternal) {
      if (!context.user) {
        throw new Error("Unauthorized");
      }

      await enforceRateLimit({
        admin: context.admin,
        action: "send-sms-notification",
        scope: `user:${context.user.id}`,
        limit: isPrivilegedUser(context.roles) ? 20 : 5,
        windowMinutes: 15,
      });

      assertSelfOrPrivileged(context.user.id, userId ?? context.user.id, context.roles);

      if (!isPrivilegedUser(context.roles)) {
        const { data: profile } = await context.admin
          .from("profiles")
          .select("phone")
          .eq("user_id", context.user.id)
          .maybeSingle();

        if (!profile?.phone || profile.phone !== to) {
          throw new Error("Forbidden");
        }
      }
    } else {
      await enforceRateLimit({
        admin: context.admin,
        action: "send-sms-notification-internal",
        scope: `ip:${getClientIp(req)}`,
        limit: 100,
        windowMinutes: 5,
      });
    }

    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const fromNumber = Deno.env.get("TWILIO_PHONE_NUMBER") ?? Deno.env.get("TWILIO_FROM_NUMBER");

    if (!accountSid || !authToken || !fromNumber) {
      throw new Error("SMS service not configured");
    }

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const params = new URLSearchParams({ To: to, From: fromNumber, Body: body });

    const resp = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization: "Basic " + btoa(`${accountSid}:${authToken}`),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!resp.ok) {
      const errorBody = await resp.text();
      console.error("Twilio error:", { status: resp.status, errorBody });
      throw new Error("SMS delivery failed");
    }

    const result = await resp.json();

    await context.admin.from("notification_delivery_log").insert({
      alert_id: null,
      user_id: userId ?? context.user?.id ?? null,
      delivery_channel: "sms",
      delivery_status: "sent",
      sent_at: new Date().toISOString(),
      failure_reason: null,
      metadata: { provider: "twilio", sid: result.sid },
    } as any);

    return jsonResponse(req, { success: true, provider: "twilio", sid: result.sid });
  } catch (error) {
    console.error("send-sms-notification error:", error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = getStatusCode(message);

    return jsonResponse(
      req,
      { error: status >= 500 ? "Request failed" : message },
      status,
    );
  }
});
