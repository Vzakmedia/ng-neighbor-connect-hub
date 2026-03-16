import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import {
  assertSelfOrPrivileged,
  getRequestContext,
  isPrivilegedUser,
} from "../_shared/auth.ts";
import { getClientIp, handleCors, jsonResponse } from "../_shared/http.ts";
import { enforceRateLimit } from "../_shared/rate-limit.ts";

interface EmailRequest {
  to: string;
  subject: string;
  body: string | Record<string, unknown>;
  type?: string;
  userId?: string;
  data?: Record<string, unknown>;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getStatusCode(message: string): number {
  if (message === "Unauthorized") return 401;
  if (message === "Forbidden") return 403;
  if (message === "Rate limit exceeded") return 429;
  if (message.startsWith("Missing required fields") || message.startsWith("Invalid")) return 400;
  return 500;
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    const context = await getRequestContext(req, { allowInternal: true, requireUser: false });
    const { to, subject, body, type = "notification", userId, data: templateData } =
      await req.json() as EmailRequest;

    if (!to || !subject || body === undefined || body === null) {
      throw new Error("Missing required fields: to, subject, body");
    }

    if (!isValidEmail(to)) {
      throw new Error("Invalid recipient email");
    }

    if (subject.length > 200) {
      throw new Error("Invalid subject length");
    }

    if (!context.isInternal) {
      if (!context.user) {
        throw new Error("Unauthorized");
      }

      await enforceRateLimit({
        admin: context.admin,
        action: "send-email-notification",
        scope: `user:${context.user.id}`,
        limit: isPrivilegedUser(context.roles) ? 30 : 10,
        windowMinutes: 15,
      });

      assertSelfOrPrivileged(context.user.id, userId ?? context.user.id, context.roles);

      const actorEmail = (context.user.email ?? "").trim().toLowerCase();
      const targetEmail = to.trim().toLowerCase();
      if (!isPrivilegedUser(context.roles) && actorEmail !== targetEmail) {
        throw new Error("Forbidden");
      }
    } else {
      await enforceRateLimit({
        admin: context.admin,
        action: "send-email-notification-internal",
        scope: `ip:${getClientIp(req)}`,
        limit: 100,
        windowMinutes: 5,
      });
    }

    const { data: emailConfig } = await context.admin
      .from("app_configuration")
      .select("config_value")
      .eq("config_key", "email_enabled")
      .single();

    if (emailConfig?.config_value === false) {
      return jsonResponse(req, { status: "skipped", reason: "global_disabled" });
    }

    if (userId) {
      const { data: userPrefs } = await context.admin
        .from("user_email_preferences")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (userPrefs && !userPrefs.email_enabled) {
        return jsonResponse(req, { status: "skipped", reason: "user_disabled" });
      }

      if (userPrefs) {
        const typeKey = type.replace("_alert", "_alerts").replace("_request", "_requests");
        if (userPrefs[typeKey] === false) {
          return jsonResponse(req, { status: "skipped", reason: "type_disabled" });
        }
      }
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("Email service not configured");
    }

    const resend = new Resend(resendApiKey);
    const from = Deno.env.get("RESEND_FROM") ?? "Notifications <onboarding@resend.dev>";

    let htmlBody = typeof body === "string" ? body : JSON.stringify(body);
    if (templateData) {
      const { generateEmailTemplate } = await import("./templates.ts");
      const appUrl = Deno.env.get("APP_URL") || "https://yourapp.com";
      htmlBody = generateEmailTemplate(type, { ...templateData, appUrl });
    }

    const emailResponse = await resend.emails.send({
      from,
      to: [to],
      subject,
      html: htmlBody,
    });

    if (emailResponse.error) {
      console.error("Error from Resend API:", emailResponse.error);
      await context.admin.from("email_logs").insert({
        recipient_email: to,
        subject,
        body,
        email_type: type,
        user_id: userId ?? context.user?.id ?? null,
        status: "failed",
        error_message: emailResponse.error.message,
        created_at: new Date().toISOString(),
      });

      return jsonResponse(req, { error: "Email delivery failed", status: "error" }, 400);
    }

    await context.admin.from("email_logs").insert({
      recipient_email: to,
      subject,
      body,
      email_type: type,
      user_id: userId ?? context.user?.id ?? null,
      status: "sent",
      provider_id: emailResponse.data?.id,
      sent_at: new Date().toISOString(),
    });

    return jsonResponse(req, {
      success: true,
      message: "Email notification sent successfully",
      recipient: to,
      type,
      provider: "resend",
      provider_id: emailResponse.data?.id,
      sentAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error sending email notification:", error);
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
