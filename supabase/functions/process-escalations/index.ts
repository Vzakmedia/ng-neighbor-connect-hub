import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getRequestContext, isPrivilegedUser } from "../_shared/auth.ts";
import { handleCors, jsonResponse } from "../_shared/http.ts";
import { enforceRateLimit } from "../_shared/rate-limit.ts";

function getStatusCode(message: string): number {
  if (message === "Unauthorized") return 401;
  if (message === "Forbidden") return 403;
  if (message === "Rate limit exceeded") return 429;
  return 500;
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    const context = await getRequestContext(req, { allowInternal: true, requireUser: false });
    const { limit = 50 } = await req.json().catch(() => ({ limit: 50 })) as { limit?: number };

    if (!context.isInternal && !isPrivilegedUser(context.roles)) {
      throw new Error("Forbidden");
    }

    await enforceRateLimit({
      admin: context.admin,
      action: "process-escalations",
      scope: context.isInternal ? "internal" : `user:${context.user?.id}`,
      limit: context.isInternal ? 120 : 10,
      windowMinutes: 15,
    });

    const { data: escalations, error: escalationError } = await context.admin
      .from("notification_escalations")
      .select("*")
      .lte("due_at", new Date().toISOString())
      .eq("status", "pending")
      .order("due_at", { ascending: true })
      .limit(Math.min(Math.max(limit, 1), 100));

    if (escalationError) {
      throw new Error("Failed to load escalations");
    }

    const results: Array<Record<string, unknown>> = [];

    for (const escalation of escalations || []) {
      try {
        const [{ data: notification }, { data: profile }, { data: alert }] = await Promise.all([
          context.admin
            .from("alert_notifications")
            .select("is_read")
            .eq("alert_id", escalation.alert_id)
            .eq("recipient_id", escalation.user_id)
            .maybeSingle(),
          context.admin.from("profiles").select("*").eq("user_id", escalation.user_id).single(),
          context.admin.from("safety_alerts").select("*").eq("id", escalation.alert_id).single(),
        ]);

        if (notification?.is_read) {
          await context.admin
            .from("notification_escalations")
            .update({ status: "skipped", processed_at: new Date().toISOString() })
            .eq("id", escalation.id);

          results.push({ id: escalation.id, status: "skipped" });
          continue;
        }

        if (!profile?.phone) {
          await context.admin
            .from("notification_escalations")
            .update({
              status: "failed",
              processed_at: new Date().toISOString(),
              last_error: "No phone on profile",
            })
            .eq("id", escalation.id);

          results.push({ id: escalation.id, status: "failed", reason: "no_phone" });
          continue;
        }

        const smsBody = `[${String(alert?.severity || "info").toUpperCase()}] ${alert?.title || "Safety Alert"} - ${alert?.description || ""}`
          .slice(0, 140);

        const { data, error } = await context.admin.functions.invoke("send-sms-notification", {
          body: {
            to: profile.phone,
            body: smsBody,
            userId: escalation.user_id,
          },
        });

        if (error || !data?.success) {
          throw new Error("SMS escalation failed");
        }

        await context.admin
          .from("notification_escalations")
          .update({
            status: "sent",
            processed_at: new Date().toISOString(),
            attempts: (escalation.attempts || 0) + 1,
          })
          .eq("id", escalation.id);

        await context.admin.rpc("track_alert_metric", {
          _alert_id: escalation.alert_id,
          _metric_type: "escalation_delivered",
          _user_id: escalation.user_id,
          _metadata: { provider: "twilio" },
        });

        results.push({ id: escalation.id, status: "sent" });
      } catch (error) {
        console.error("Escalation processing error:", error);
        await context.admin
          .from("notification_escalations")
          .update({
            attempts: (escalation.attempts || 0) + 1,
            last_error: error instanceof Error ? error.message : "Unexpected error",
          })
          .eq("id", escalation.id);

        results.push({ id: escalation.id, status: "error" });
      }
    }

    return jsonResponse(req, { processed: results.length, results });
  } catch (error) {
    console.error("process-escalations error:", error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = getStatusCode(message);
    return jsonResponse(req, { error: status >= 500 ? "Request failed" : message }, status);
  }
});
