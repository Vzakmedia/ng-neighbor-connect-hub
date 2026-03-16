import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  getRequestContext,
  isPrivilegedUser,
} from "../_shared/auth.ts";
import { handleCors, jsonResponse } from "../_shared/http.ts";
import { enforceRateLimit } from "../_shared/rate-limit.ts";

const severityRank: Record<string, number> = { low: 1, medium: 2, high: 3, critical: 4 };

function timeToMinutes(value?: string | null): number | null {
  if (!value) return null;
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + (minutes || 0);
}

function isWithinQuietHours(
  quietStart?: string | null,
  quietEnd?: string | null,
  timezone?: string | null,
): boolean {
  if (!quietStart || !quietEnd || !timezone) return false;

  const formatter = new Intl.DateTimeFormat("en-US", {
    hour12: false,
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
  });

  const parts = formatter.formatToParts(new Date());
  const hour = Number(parts.find((part) => part.type === "hour")?.value || "0");
  const minute = Number(parts.find((part) => part.type === "minute")?.value || "0");
  const current = hour * 60 + minute;
  const start = timeToMinutes(quietStart);
  const end = timeToMinutes(quietEnd);

  if (start === null || end === null) return false;
  if (start <= end) return current >= start && current <= end;
  return current >= start || current <= end;
}

function renderTemplate(value: string | null | undefined, variables: Record<string, unknown>): string | undefined {
  if (!value) return undefined;
  return value.replace(/\{\{\s*(\w+)\s*\}\}/g, (_match, key) => String(variables[key] ?? ""));
}

function getStatusCode(message: string): number {
  if (message === "Unauthorized") return 401;
  if (message === "Forbidden") return 403;
  if (message === "Rate limit exceeded") return 429;
  if (message.startsWith("Missing required")) return 400;
  if (message === "Alert not found" || message === "User not found") return 404;
  return 500;
}

interface DeliveryRequest {
  alertId: string;
  userId: string;
  channels: string[];
  priority?: number;
  templateKey?: string;
  variables?: Record<string, unknown>;
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    const context = await getRequestContext(req, { allowInternal: true, requireUser: false });
    const {
      alertId,
      userId,
      channels,
      priority = 3,
      templateKey,
      variables = {},
    } = await req.json() as DeliveryRequest;

    if (!alertId || !userId || !Array.isArray(channels) || channels.length === 0) {
      throw new Error("Missing required fields");
    }

    if (!context.isInternal) {
      if (!context.user) {
        throw new Error("Unauthorized");
      }

      await enforceRateLimit({
        admin: context.admin,
        action: "notification-delivery",
        scope: `user:${context.user.id}`,
        limit: isPrivilegedUser(context.roles) ? 50 : 20,
        windowMinutes: 15,
      });
    }

    const [{ data: alert, error: alertError }, { data: profile, error: profileError }] = await Promise.all([
      context.admin.from("safety_alerts").select("*").eq("id", alertId).single(),
      context.admin.from("profiles").select("*").eq("user_id", userId).single(),
    ]);

    if (alertError || !alert) {
      throw new Error("Alert not found");
    }

    if (profileError || !profile) {
      throw new Error("User not found");
    }

    if (
      !context.isInternal &&
      !isPrivilegedUser(context.roles) &&
      alert.user_id !== context.user?.id &&
      context.user?.id !== userId
    ) {
      throw new Error("Forbidden");
    }

    const [{ data: prefs }, templateSingle] = await Promise.all([
      context.admin
        .from("notification_preferences")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle(),
      templateKey
        ? context.admin
          .from("notification_templates")
          .select("*")
          .eq("name", templateKey)
          .eq("is_active", true)
          .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

    const templateByChannel: Record<string, { subject?: string; body?: string }> = {};
    const templateRow = templateSingle.data as Record<string, string> | null;
    if (templateRow) {
      templateByChannel.email = {
        subject: templateRow.title_template,
        body: templateRow.email_template || templateRow.body_template,
      };
      templateByChannel.sms = {
        body: templateRow.sms_template || templateRow.body_template,
      };
    }

    const baseVariables = {
      title: alert.title ?? "Safety Alert",
      description: alert.description ?? "",
      severity: alert.severity ?? "info",
      address: alert.address ?? "",
      user_name: profile.full_name || profile.email || "",
      timestamp: new Date().toISOString(),
      ...variables,
    };

    const preferenceEnabled = {
      email: prefs?.email_enabled ?? true,
      sms: prefs?.sms_enabled ?? false,
      push: prefs?.push_enabled ?? true,
      websocket: true,
    } as Record<string, boolean>;

    let allowedChannels = channels.filter((channel) => preferenceEnabled[channel] !== false);
    const quietNow = isWithinQuietHours(prefs?.quiet_hours_start, prefs?.quiet_hours_end, prefs?.timezone);
    const severity = String(alert.severity ?? "low").toLowerCase();
    const minSeverity = String(prefs?.priority_filter ?? "low").toLowerCase();

    if ((severityRank[severity] ?? 1) < (severityRank[minSeverity] ?? 1)) {
      allowedChannels = allowedChannels.filter((channel) => channel === "websocket");
    }

    if (quietNow && severity !== "critical") {
      allowedChannels = allowedChannels.filter((channel) => channel === "websocket");
    }

    const results: Array<Record<string, unknown>> = [];

    if (allowedChannels.includes("websocket")) {
      try {
        const channel = context.admin.channel(`user_${userId}`);
        await channel.send({
          type: "broadcast",
          event: "alert_notification",
          payload: {
            alertId: alert.id,
            title: alert.title || "Safety Alert",
            description: alert.description,
            severity: alert.severity,
            location: alert.address,
            timestamp: new Date().toISOString(),
            type: "safety_alert",
          },
        });

        results.push({ channel: "websocket", status: "sent" });
      } catch (error) {
        console.error("Websocket delivery error:", error);
        results.push({ channel: "websocket", status: "failed" });
      }
    }

    if (allowedChannels.includes("push")) {
      const { data, error } = await context.admin.functions.invoke("send-push-notification", {
        body: {
          userId,
          title: alert.title || "Safety Alert",
          message: alert.description || "New notification",
          type: severity === "critical" ? "emergency" : "notification",
          priority: severity === "critical" ? "high" : "normal",
          data: { alertId: alert.id, priority },
        },
      });

      results.push({
        channel: "push",
        status: error || !data?.success ? "failed" : "sent",
      });
    }

    if (allowedChannels.includes("sms") && profile.phone) {
      const smsTemplate = templateByChannel.sms?.body || "[{{severity}}] {{title}} - {{description}}";
      const smsBody = (renderTemplate(smsTemplate, baseVariables) || "").slice(0, 140);

      const { data, error } = await context.admin.functions.invoke("send-sms-notification", {
        body: {
          to: profile.phone,
          body: smsBody,
          userId,
        },
      });

      results.push({
        channel: "sms",
        status: error || !data?.success ? "failed" : "sent",
      });
    }

    if (allowedChannels.includes("email") && profile.email) {
      const subject = renderTemplate(templateByChannel.email?.subject || (alert.title || "Safety Alert"), baseVariables) ||
        (alert.title || "Safety Alert");
      const html = renderTemplate(
        templateByChannel.email?.body ||
          `
          <h2>{{title}}</h2>
          <p><strong>Severity:</strong> {{severity}}</p>
          <p>{{description}}</p>
          <p><strong>Location:</strong> {{address}}</p>
          <p style="color:#888">Sent at {{timestamp}}</p>
        `,
        baseVariables,
      ) || "";

      const { data, error } = await context.admin.functions.invoke("send-email-notification", {
        body: {
          to: profile.email,
          subject,
          body: html,
          type: severity === "critical" ? "emergency_alert" : "notification",
          userId,
        },
      });

      results.push({
        channel: "email",
        status: error || !data?.success ? "failed" : "sent",
      });
    }

    if (results.length > 0) {
      await context.admin.from("notification_delivery_log").insert(
        results.map((result) => ({
          alert_id: alertId,
          user_id: userId,
          delivery_channel: String(result.channel),
          delivery_status: String(result.status),
          sent_at: new Date().toISOString(),
          failure_reason: result.status === "failed" ? "delivery_failed" : null,
        })),
      );
    }

    return jsonResponse(req, {
      success: true,
      alertId,
      userId,
      results,
    });
  } catch (error) {
    console.error("Notification delivery error:", error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = getStatusCode(message);

    return jsonResponse(
      req,
      { error: status >= 500 ? "Request failed" : message },
      status,
    );
  }
});
