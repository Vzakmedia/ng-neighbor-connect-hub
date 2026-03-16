import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getRequestContext, hasAnyRole } from "../_shared/auth.ts";
import { handleCors, jsonResponse } from "../_shared/http.ts";
import { enforceRateLimit } from "../_shared/rate-limit.ts";

function getStatusCode(message: string): number {
  if (message === "Unauthorized") return 401;
  if (message === "Forbidden") return 403;
  if (message === "Rate limit exceeded") return 429;
  if (message.startsWith("Missing") || message.startsWith("Invalid")) return 400;
  if (message === "User not found") return 404;
  return 500;
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    const context = await getRequestContext(req, { allowInternal: false, requireUser: true });

    if (!context.user || !hasAnyRole(context.roles, ["admin", "super_admin"])) {
      throw new Error("Forbidden");
    }

    await enforceRateLimit({
      admin: context.admin,
      action: "admin-resend-verification",
      scope: `user:${context.user.id}`,
      limit: 20,
      windowMinutes: 15,
    });

    const { action, userId, email } = await req.json() as { action?: string; userId?: string; email?: string };
    if (!action || (!userId && !email)) {
      throw new Error("Missing required parameters");
    }

    let targetUserId = userId ?? null;
    let recipientEmail = email ?? null;

    if (userId) {
      const { data, error } = await context.admin.auth.admin.getUserById(userId);
      if (error || !data.user) {
        throw new Error("User not found");
      }

      targetUserId = data.user.id;
      recipientEmail = data.user.email ?? null;
    }

    if (!recipientEmail) {
      throw new Error("Missing required parameters");
    }

    if (action === "resend") {
      const { error: resendError } = await context.admin.auth.admin.generateLink({
        type: "signup",
        email: recipientEmail,
        options: {
          redirectTo: `${req.headers.get("origin") || "https://neighborlink.ng"}/auth/verify-email`,
        },
      });

      if (resendError) {
        throw new Error("Failed to resend verification");
      }

      await context.admin.from("email_audit_logs").insert({
        user_id: targetUserId,
        recipient_email: recipientEmail,
        email_type: "admin_resend",
        action_type: "sent",
        sent_by_admin_id: context.user.id,
        metadata: { action: "resend" },
      });

      return jsonResponse(req, { success: true, message: "Verification email sent successfully" });
    }

    if (action === "verify") {
      if (!userId) {
        throw new Error("Missing required parameters");
      }

      const { error: updateError } = await context.admin.auth.admin.updateUserById(userId, {
        email_confirm: true,
      });

      if (updateError) {
        throw new Error("Failed to verify user");
      }

      await context.admin.from("email_audit_logs").insert({
        user_id: userId,
        recipient_email: recipientEmail,
        email_type: "admin_manual_verification",
        action_type: "manually_verified",
        sent_by_admin_id: context.user.id,
        metadata: { action: "manual_verify" },
      });

      return jsonResponse(req, { success: true, message: "User email verified successfully" });
    }

    if (action === "delete") {
      if (!userId) {
        throw new Error("Missing required parameters");
      }

      const { error: deleteError } = await context.admin.auth.admin.deleteUser(userId);
      if (deleteError) {
        throw new Error("Failed to delete user");
      }

      await context.admin.from("email_audit_logs").insert({
        user_id: userId,
        recipient_email: recipientEmail,
        email_type: "admin_user_deletion",
        action_type: "deleted",
        sent_by_admin_id: context.user.id,
        metadata: { action: "delete" },
      });

      return jsonResponse(req, { success: true, message: "User deleted successfully" });
    }

    throw new Error("Invalid action");
  } catch (error) {
    console.error("admin-resend-verification error:", error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = getStatusCode(message);

    return jsonResponse(
      req,
      { error: status >= 500 ? "Request failed" : message },
      status,
    );
  }
});
