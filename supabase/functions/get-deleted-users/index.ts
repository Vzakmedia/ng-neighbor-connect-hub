import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getRequestContext, hasAnyRole } from "../_shared/auth.ts";
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
    const context = await getRequestContext(req, { allowInternal: false, requireUser: true });

    if (!context.user || !hasAnyRole(context.roles, ["super_admin", "admin"])) {
      throw new Error("Forbidden");
    }

    await enforceRateLimit({
      admin: context.admin,
      action: "get-deleted-users",
      scope: `user:${context.user.id}`,
      limit: 30,
      windowMinutes: 15,
    });

    const { data: deletedUsers, error: deletedError } = await context.admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (deletedError) {
      throw new Error("Failed to fetch users");
    }

    return jsonResponse(req, {
      success: true,
      users: deletedUsers.users
        .filter((user) => user.deleted_at !== null)
        .map((user) => ({
          id: user.id,
          email: user.email,
          deleted_at: user.deleted_at,
          created_at: user.created_at,
        })),
    });
  } catch (error) {
    console.error("get-deleted-users error:", error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = getStatusCode(message);

    return jsonResponse(
      req,
      { error: status >= 500 ? "Request failed" : message },
      status,
    );
  }
});
