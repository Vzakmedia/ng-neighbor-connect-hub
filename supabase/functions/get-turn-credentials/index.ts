import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getRequestContext } from "../_shared/auth.ts";
import { handleCors, jsonResponse } from "../_shared/http.ts";
import { enforceRateLimit } from "../_shared/rate-limit.ts";

function getStatusCode(message: string): number {
  if (message === "Unauthorized") return 401;
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

    if (!context.user) {
      throw new Error("Unauthorized");
    }

    await enforceRateLimit({
      admin: context.admin,
      action: "get-turn-credentials",
      scope: `user:${context.user.id}`,
      limit: 120,
      windowMinutes: 15,
    });

    const turnServer = Deno.env.get("TURN_SERVER") || "turn:turn.neighborlink.ng:3478";
    const turnUsername = Deno.env.get("TURN_USERNAME");
    const turnPassword = Deno.env.get("TURN_PASSWORD");

    const iceServers: Array<Record<string, unknown>> = [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ];

    if (turnUsername && turnPassword) {
      iceServers.push({
        urls: [`${turnServer}?transport=udp`, `${turnServer}?transport=tcp`],
        username: turnUsername,
        credential: turnPassword,
      });
    } else {
      iceServers.push({
        urls: [
          "turn:openrelay.metered.ca:80",
          "turn:openrelay.metered.ca:443",
          "turns:openrelay.metered.ca:443",
        ],
        username: "openrelayproject",
        credential: "openrelayproject",
      });
    }

    return jsonResponse(req, { iceServers });
  } catch (error) {
    console.error("get-turn-credentials error:", error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = getStatusCode(message);

    return jsonResponse(
      req,
      { error: status >= 500 ? "Request failed" : message },
      status,
    );
  }
});
