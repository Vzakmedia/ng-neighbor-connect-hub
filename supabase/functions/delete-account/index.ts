import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getRequestContext } from "../_shared/auth.ts";
import { handleCors, jsonResponse } from "../_shared/http.ts";
import { enforceRateLimit } from "../_shared/rate-limit.ts";

function getStatusCode(message: string): number {
  if (message === "Unauthorized") return 401;
  if (message === "Rate limit exceeded") return 429;
  if (message.startsWith("Invalid")) return 400;
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
      action: "delete-account",
      scope: `user:${context.user.id}`,
      limit: 2,
      windowMinutes: 60,
    });

    const { confirmation } = await req.json() as { confirmation?: string };
    if (confirmation !== "DELETE_MY_ACCOUNT") {
      throw new Error("Invalid confirmation");
    }

    await context.admin.from("activity_logs").insert({
      user_id: context.user.id,
      action_type: "account_deletion_initiated",
      resource_type: "user",
      resource_id: context.user.id,
      details: {
        email: context.user.email ?? null,
        timestamp: new Date().toISOString(),
      },
    });

    await context.admin.from("direct_messages").delete().or(`sender_id.eq.${context.user.id},recipient_id.eq.${context.user.id}`);
    await context.admin.from("direct_conversations").delete().or(`participant_one.eq.${context.user.id},participant_two.eq.${context.user.id}`);
    await context.admin.from("post_likes").delete().eq("user_id", context.user.id);
    await context.admin.from("post_comments").delete().eq("user_id", context.user.id);
    await context.admin.from("community_posts").delete().eq("user_id", context.user.id);
    await context.admin.from("marketplace_items").delete().eq("user_id", context.user.id);
    await context.admin.from("services").delete().eq("user_id", context.user.id);
    await context.admin.from("emergency_contacts").delete().eq("user_id", context.user.id);
    await context.admin.from("emergency_contact_requests").delete().or(`requester_id.eq.${context.user.id},target_user_id.eq.${context.user.id}`);
    await context.admin.from("user_settings").delete().eq("user_id", context.user.id);
    await context.admin.from("messaging_preferences").delete().eq("user_id", context.user.id);
    await context.admin.from("notification_preferences").delete().eq("user_id", context.user.id);
    await context.admin.from("user_roles").delete().eq("user_id", context.user.id);
    await context.admin.from("profiles").delete().eq("user_id", context.user.id);

    const { error: deleteError } = await context.admin.auth.admin.deleteUser(context.user.id);
    if (deleteError) {
      throw new Error("Failed to delete account");
    }

    return jsonResponse(req, {
      success: true,
      message: "Your account has been permanently deleted.",
    });
  } catch (error) {
    console.error("delete-account error:", error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = getStatusCode(message);

    return jsonResponse(
      req,
      { error: status >= 500 ? "Request failed" : message },
      status,
    );
  }
});
