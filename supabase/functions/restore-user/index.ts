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
      action: "restore-user",
      scope: `user:${context.user.id}`,
      limit: 10,
      windowMinutes: 15,
    });

    const { userId } = await req.json() as { userId?: string };
    if (!userId) {
      throw new Error("Missing userId");
    }

    const { error: restoreError } = await context.admin.auth.admin.updateUserById(userId, {
      user_metadata: {},
      app_metadata: {},
    });

    if (restoreError) {
      throw new Error("Failed to restore user");
    }

    return jsonResponse(req, {
      success: true,
      message: "User restoration initiated",
    });
  } catch (error) {
    console.error("restore-user error:", error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = getStatusCode(message);

    return jsonResponse(
      req,
      { error: status >= 500 ? "Request failed" : message },
      status,
    );
  }
});
