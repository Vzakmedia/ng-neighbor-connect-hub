import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getRequestContext, hasAnyRole } from "../_shared/auth.ts";
import { handleCors, jsonResponse } from "../_shared/http.ts";
import { enforceRateLimit } from "../_shared/rate-limit.ts";

function getStatusCode(message: string): number {
  if (message === "Unauthorized") return 401;
  if (message === "Forbidden") return 403;
  if (message === "Rate limit exceeded") return 429;
  if (message.startsWith("Missing")) return 400;
  return 500;
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    const context = await getRequestContext(req, { allowInternal: false, requireUser: true });

    if (!context.user || !hasAnyRole(context.roles, ["super_admin", "admin"])) {
      throw new Error("Forbidden");
    }

    await enforceRateLimit({
      admin: context.admin,
      action: "logout-user",
      scope: `user:${context.user.id}`,
      limit: 20,
      windowMinutes: 15,
    });

    const { userId } = await req.json() as { userId?: string };
    if (!userId) {
      throw new Error("Missing userId");
    }

    const { error: updateError } = await context.admin.auth.admin.updateUserById(userId, {
      app_metadata: {
        force_logout: Date.now(),
      },
    });

    if (updateError) {
      throw new Error("Failed to logout user");
    }

    await context.admin.from("activity_logs").insert({
      user_id: context.user.id,
      action_type: "force_logout",
      resource_type: "user",
      resource_id: userId,
      details: {
        target_user_id: userId,
        timestamp: new Date().toISOString(),
        reason: "admin_initiated_logout",
      },
    });

    return jsonResponse(req, {
      success: true,
      message: "User has been logged out successfully",
    });
  } catch (error) {
    console.error("logout-user error:", error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = getStatusCode(message);

    return jsonResponse(
      req,
      { error: status >= 500 ? "Request failed" : message },
      status,
    );
  }
});
