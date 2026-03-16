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

    if (!context.isInternal && !isPrivilegedUser(context.roles)) {
      throw new Error("Forbidden");
    }

    await enforceRateLimit({
      admin: context.admin,
      action: "clean-expired-calls",
      scope: context.isInternal ? "internal" : `user:${context.user?.id}`,
      limit: context.isInternal ? 120 : 10,
      windowMinutes: 15,
    });

    const { error, count } = await context.admin
      .from("call_signaling")
      .delete({ count: "exact" })
      .lt("expires_at", new Date().toISOString());

    if (error) {
      throw new Error("Failed to clean expired calls");
    }

    return jsonResponse(req, {
      success: true,
      deleted_count: count || 0,
      message: "Cleanup complete",
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = getStatusCode(message);
    return jsonResponse(req, { error: status >= 500 ? "Request failed" : message }, status);
  }
});
