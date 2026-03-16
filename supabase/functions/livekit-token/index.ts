import { SignJWT } from "https://esm.sh/jose@5.2.3";
import { getRequestContext } from "../_shared/auth.ts";
import { handleCors, jsonResponse } from "../_shared/http.ts";
import { enforceRateLimit } from "../_shared/rate-limit.ts";

function getStatusCode(message: string): number {
  if (message === "Unauthorized") return 401;
  if (message === "Rate limit exceeded") return 429;
  if (message.startsWith("Missing") || message.startsWith("Invalid")) return 400;
  return 500;
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  if (req.method === "GET") {
    return jsonResponse(req, { status: "active", time: new Date().toISOString() });
  }

  try {
    const context = await getRequestContext(req, { allowInternal: false, requireUser: true });

    if (!context.user) {
      throw new Error("Unauthorized");
    }

    await enforceRateLimit({
      admin: context.admin,
      action: "livekit-token",
      scope: `user:${context.user.id}`,
      limit: 60,
      windowMinutes: 15,
    });

    const { roomName, participantName } = await req.json() as { roomName?: string; participantName?: string };
    if (!roomName) {
      throw new Error("Missing roomName");
    }

    if (!/^[a-zA-Z0-9:_-]{1,120}$/.test(roomName)) {
      throw new Error("Invalid roomName");
    }

    const apiKey = Deno.env.get("LIVEKIT_API_KEY");
    const apiSecret = Deno.env.get("LIVEKIT_API_SECRET");
    if (!apiKey || !apiSecret) {
      throw new Error("Token service unavailable");
    }

    const name = String(participantName || context.user.email || context.user.id).slice(0, 120);
    const secret = new TextEncoder().encode(apiSecret);

    const token = await new SignJWT({
      name,
      video: {
        room: roomName,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
      },
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuer(apiKey)
      .setSubject(context.user.id)
      .setExpirationTime("1h")
      .setNotBefore("0s")
      .sign(secret);

    return jsonResponse(req, { token });
  } catch (error) {
    console.error("livekit-token error:", error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = getStatusCode(message);

    return jsonResponse(
      req,
      { error: status >= 500 ? "Request failed" : message },
      status,
    );
  }
});
