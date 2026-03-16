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
    const context = await getRequestContext(req, { allowInternal: false, requireUser: true });

    if (!context.user || !isPrivilegedUser(context.roles)) {
      throw new Error("Forbidden");
    }

    await enforceRateLimit({
      admin: context.admin,
      action: "get-google-calendar-config",
      scope: `user:${context.user.id}`,
      limit: 60,
      windowMinutes: 15,
    });

    const googleApiKey = Deno.env.get("GOOGLE_CALENDAR_API_KEY");
    const googleClientId = Deno.env.get("GOOGLE_CALENDAR_CLIENT_ID");

    if (!googleApiKey || !googleClientId) {
      throw new Error("Configuration unavailable");
    }

    return jsonResponse(req, {
      apiKey: googleApiKey,
      clientId: googleClientId,
      discoveryDoc: "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
      scopes: "https://www.googleapis.com/auth/calendar.events",
    });
  } catch (error) {
    console.error("get-google-calendar-config error:", error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = getStatusCode(message);

    return jsonResponse(
      req,
      { error: status >= 500 ? "Request failed" : message },
      status,
    );
  }
});
