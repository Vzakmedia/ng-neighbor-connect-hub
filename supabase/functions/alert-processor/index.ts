import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  getRequestContext,
  isPrivilegedUser,
} from "../_shared/auth.ts";
import { handleCors, jsonResponse } from "../_shared/http.ts";
import { enforceRateLimit } from "../_shared/rate-limit.ts";

interface AlertProcessingRequest {
  alertId: string;
  priority?: number;
  targetingRules?: Array<{ type: string; criteria: unknown }>;
}

function getStatusCode(message: string): number {
  if (message === "Unauthorized") return 401;
  if (message === "Forbidden") return 403;
  if (message === "Rate limit exceeded") return 429;
  if (message.startsWith("Missing required")) return 400;
  if (message === "Alert not found") return 404;
  return 500;
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    const context = await getRequestContext(req, { allowInternal: true, requireUser: false });
    const { alertId, priority = 3 } = await req.json() as AlertProcessingRequest;

    if (!alertId) {
      throw new Error("Missing required fields");
    }

    if (!context.isInternal) {
      if (!context.user) {
        throw new Error("Unauthorized");
      }

      await enforceRateLimit({
        admin: context.admin,
        action: "alert-processor",
        scope: `user:${context.user.id}`,
        limit: isPrivilegedUser(context.roles) ? 30 : 10,
        windowMinutes: 15,
      });
    }

    const { data: alert, error: alertError } = await context.admin
      .from("safety_alerts")
      .select("*")
      .eq("id", alertId)
      .single();

    if (alertError || !alert) {
      throw new Error("Alert not found");
    }

    if (
      !context.isInternal &&
      !isPrivilegedUser(context.roles) &&
      context.user?.id !== alert.user_id
    ) {
      throw new Error("Forbidden");
    }

    const { data: alertCreatorProfile } = await context.admin
      .from("profiles")
      .select("neighborhood, full_name")
      .eq("user_id", alert.user_id)
      .single();

    let targetUsers: Array<{ user_id: string; full_name?: string | null; neighborhood?: string | null }> = [];

    if (alert.severity === "critical" && alertCreatorProfile?.neighborhood) {
      const { data: neighborhoodUsers } = await context.admin
        .from("profiles")
        .select("user_id, full_name, neighborhood")
        .eq("neighborhood", alertCreatorProfile.neighborhood)
        .neq("user_id", alert.user_id);

      targetUsers = neighborhoodUsers || [];
    } else {
      const { data: nearbyUsers } = await context.admin
        .from("profiles")
        .select("user_id, full_name, neighborhood")
        .eq("neighborhood", alertCreatorProfile?.neighborhood || "")
        .neq("user_id", alert.user_id)
        .limit(50);

      targetUsers = nearbyUsers || [];
    }

    if (targetUsers.length > 0) {
      await context.admin.from("notification_delivery_log").insert(
        targetUsers.map((user) => ({
          alert_id: alertId,
          user_id: user.user_id,
          delivery_channel: "websocket",
          delivery_status: "pending",
        })),
      );
    }

    await context.admin
      .from("alert_queue")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("alert_id", alertId);

    for (const user of targetUsers) {
      const channel = context.admin.channel(`user_${user.user_id}`);
      await channel.send({
        type: "broadcast",
        event: "new_alert",
        payload: {
          alert,
          severity: alert.severity,
          creator: alertCreatorProfile?.full_name || "Unknown",
          timestamp: new Date().toISOString(),
        },
      });
    }

    await context.admin.rpc("set_alert_cache", {
      _cache_key: `alert_${alertId}`,
      _cache_data: {
        alert,
        targetUsers: targetUsers.length,
        processedAt: new Date().toISOString(),
      },
      _ttl_seconds: 300,
    });

    await context.admin.rpc("track_alert_metric", {
      _alert_id: alertId,
      _metric_type: "processed",
      _metadata: {
        targetUsers: targetUsers.length,
        priority,
        processingTime: Date.now(),
      },
    });

    return jsonResponse(req, {
      success: true,
      alertId,
      targetUsers: targetUsers.length,
      processedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Alert processing error:", error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = getStatusCode(message);

    return jsonResponse(
      req,
      {
        error: status >= 500 ? "Request failed" : message,
        timestamp: new Date().toISOString(),
      },
      status,
    );
  }
});
