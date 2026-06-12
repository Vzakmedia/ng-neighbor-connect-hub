// Issues scoped Ably TokenRequests for the chat delivery layer.
//
// The client exchanges this TokenRequest with Ably directly; the API key
// never leaves the server. Each user can only SUBSCRIBE to their own
// chat channel (chat:{userId}) — publishing is done server-side by the
// direct_messages database trigger.
//
// Required secret: ABLY_API_KEY (format "keyName:keySecret")
//   npx supabase secrets set ABLY_API_KEY=xxxxx.yyyyy:zzzzzzzz

import { getRequestContext } from "../_shared/auth.ts";
import { handleCors, jsonResponse } from "../_shared/http.ts";
import { enforceRateLimit } from "../_shared/rate-limit.ts";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function getStatusCode(message: string): number {
  if (message === "Unauthorized") return 401;
  if (message === "Rate limit exceeded") return 429;
  return 500;
}

async function hmacSha256Base64(key: string, text: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    new TextEncoder().encode(text),
  );
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
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
      action: "ably-token",
      scope: `user:${context.user.id}`,
      limit: 30,
      windowMinutes: 15,
    });

    const apiKey = Deno.env.get("ABLY_API_KEY");
    if (!apiKey || !apiKey.includes(":")) {
      throw new Error("Token service unavailable");
    }

    const [keyName, keySecret] = apiKey.split(":", 2);
    const userId = context.user.id;

    // Subscribe-only capability on the user's own chat channel
    const capability = JSON.stringify({ [`chat:${userId}`]: ["subscribe"] });
    const timestamp = Date.now();
    const nonce = crypto.randomUUID().replace(/-/g, "");

    // Ably TokenRequest signing text (TTL, capability, clientId, ts, nonce)
    const signText =
      `${keyName}\n${TOKEN_TTL_MS}\n${capability}\n${userId}\n${timestamp}\n${nonce}\n`;
    const mac = await hmacSha256Base64(keySecret, signText);

    return jsonResponse(req, {
      tokenRequest: {
        keyName,
        ttl: TOKEN_TTL_MS,
        capability,
        clientId: userId,
        timestamp,
        nonce,
        mac,
      },
    });
  } catch (error) {
    console.error("ably-token error:", error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = getStatusCode(message);

    return jsonResponse(
      req,
      { error: status >= 500 ? "Request failed" : message },
      status,
    );
  }
});
