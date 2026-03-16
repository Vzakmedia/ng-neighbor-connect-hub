import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getRequestContext, hasAnyRole } from "../_shared/auth.ts";
import { handleCors, jsonResponse } from "../_shared/http.ts";
import { enforceRateLimit } from "../_shared/rate-limit.ts";

interface UpdateStatusRequest {
  panic_alert_id: string;
  new_status: "active" | "resolved" | "investigating" | "false_alarm";
  update_note?: string;
}

const allowedStatuses = new Set(["active", "resolved", "investigating", "false_alarm"]);

function getStatusCode(message: string): number {
  if (message === "Unauthorized") return 401;
  if (message === "Forbidden") return 403;
  if (message === "Rate limit exceeded") return 429;
  if (message === "Panic alert not found") return 404;
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
      action: "update-panic-alert-status",
      scope: `user:${context.user.id}`,
      limit: 30,
      windowMinutes: 15,
    });

    const { panic_alert_id, new_status, update_note }: UpdateStatusRequest = await req.json();
    if (!panic_alert_id || !new_status) {
      throw new Error("Missing required fields");
    }

    if (!allowedStatuses.has(new_status)) {
      throw new Error("Invalid status");
    }

    const { data: panicAlert, error: panicAlertError } = await context.admin
      .from("panic_alerts")
      .select("*")
      .eq("id", panic_alert_id)
      .single();

    if (panicAlertError || !panicAlert) {
      throw new Error("Panic alert not found");
    }

    const isCreator = panicAlert.user_id === context.user.id;
    let isModerator = hasAnyRole(context.roles, ["moderator", "super_admin", "admin", "manager"]);
    let isEmergencyContact = false;

    if (!isModerator) {
      const [contentModResult, emergencyMgmtResult] = await Promise.all([
        context.admin.rpc("has_staff_permission", {
          _user_id: context.user.id,
          _permission: "content_moderation",
          _access_type: "write",
        }),
        context.admin.rpc("has_staff_permission", {
          _user_id: context.user.id,
          _permission: "emergency_management",
          _access_type: "write",
        }),
      ]);

      isModerator = contentModResult.data === true || emergencyMgmtResult.data === true;
    }

    if (!isCreator && !isModerator) {
      const { data: userProfile } = await context.admin
        .from("profiles")
        .select("phone, full_name")
        .eq("user_id", context.user.id)
        .single();

      if (userProfile?.phone) {
        const { data: emergencyContacts } = await context.admin
          .from("emergency_contacts")
          .select("id")
          .eq("user_id", panicAlert.user_id)
          .eq("phone_number", userProfile.phone);

        isEmergencyContact = (emergencyContacts?.length ?? 0) > 0;
      }
    }

    if (!isCreator && !isModerator && !isEmergencyContact) {
      throw new Error("Forbidden");
    }

    const updateData: Record<string, unknown> = {
      is_resolved: new_status === "resolved",
    };

    const panicKeys = Object.keys(panicAlert || {});
    if (panicKeys.includes("resolved_at")) {
      updateData.resolved_at = new_status === "resolved" ? new Date().toISOString() : null;
    }
    if (panicKeys.includes("resolved_by")) {
      updateData.resolved_by = new_status === "resolved" ? context.user.id : null;
    }

    const { error: updateError } = await context.admin
      .from("panic_alerts")
      .update(updateData)
      .eq("id", panic_alert_id);

    if (updateError) {
      throw new Error("Failed to update panic alert");
    }

    const safetyAlertUpdate: Record<string, unknown> = {
      status: new_status,
      updated_at: new Date().toISOString(),
    };

    if (new_status === "resolved") {
      safetyAlertUpdate.verified_at = new Date().toISOString();
      safetyAlertUpdate.verified_by = context.user.id;
    }

    const timeWindowStart = new Date(new Date(panicAlert.created_at).getTime() - 1000).toISOString();
    const timeWindowEnd = new Date(new Date(panicAlert.created_at).getTime() + 1000).toISOString();

    const { error: safetyUpdateError } = await context.admin
      .from("safety_alerts")
      .update(safetyAlertUpdate)
      .eq("user_id", panicAlert.user_id)
      .eq("severity", "critical")
      .gte("created_at", timeWindowStart)
      .lte("created_at", timeWindowEnd);

    if (safetyUpdateError) {
      console.error("update-panic-alert-status safety alert update error:", safetyUpdateError);
    }

    if (update_note) {
      const [{ data: userProfile }, { data: safetyAlert }] = await Promise.all([
        context.admin.from("profiles").select("full_name").eq("user_id", context.user.id).single(),
        context.admin
          .from("safety_alerts")
          .select("id")
          .eq("user_id", panicAlert.user_id)
          .eq("severity", "critical")
          .gte("created_at", timeWindowStart)
          .lte("created_at", timeWindowEnd)
          .single(),
      ]);

      if (safetyAlert?.id) {
        await context.admin.from("alert_responses").insert({
          alert_id: safetyAlert.id,
          user_id: context.user.id,
          response_type: "status_update",
          comment: `Status updated to ${new_status.replace("_", " ")} by ${userProfile?.full_name || "User"}: ${update_note}`,
        });
      }
    }

    await context.admin.from("activity_logs").insert({
      user_id: context.user.id,
      action_type: "update_panic_alert_status",
      resource_type: "panic_alert",
      resource_id: panic_alert_id,
      details: {
        new_status,
        update_note: update_note || null,
        alert_user_id: panicAlert.user_id,
        panic_created_at: panicAlert.created_at,
      },
      user_agent: req.headers.get("user-agent") || null,
    });

    const { data: updatedAlert } = await context.admin
      .from("panic_alerts")
      .select("*")
      .eq("id", panic_alert_id)
      .single();

    return jsonResponse(req, {
      success: true,
      panic_alert: updatedAlert,
      message: `Panic alert status updated to ${new_status.replace("_", " ")}`,
    });
  } catch (error) {
    console.error("update-panic-alert-status error:", error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = getStatusCode(message);

    return jsonResponse(
      req,
      { error: status >= 500 ? "Request failed" : message },
      status,
    );
  }
});
