/** Base64url-encode a string (required for JWT segments). */
function b64url(str: string): string {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export async function getFcmAccessToken(serviceAccount: Record<string, string>): Promise<string> {
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const encodedHeader = b64url(JSON.stringify(header));
  const encodedClaim = b64url(JSON.stringify(claim));
  const signatureInput = `${encodedHeader}.${encodedClaim}`;

  const privateKey = (serviceAccount.private_key ?? "")
    .replace(/\\n/g, "\n")
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .trim();

  const binaryKey = Uint8Array.from(atob(privateKey), (char) => char.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(signatureInput),
  );

  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  const jwt = `${signatureInput}.${encodedSignature}`;
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to obtain FCM access token");
  }

  const data = await response.json();
  return data.access_token;
}

function stringifyData(data: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, typeof value === "string" ? value : JSON.stringify(value)]),
  );
}

export async function sendFcmMessage(
  token: string,
  payload: {
    title: string;
    body: string;
    data?: Record<string, unknown>;
    priority?: "normal" | "high";
    channelId?: string;
    category?: string;
  },
): Promise<{ ok: boolean; result: unknown }> {
  const serviceAccountJson = Deno.env.get("FCM_SERVICE_ACCOUNT");
  if (!serviceAccountJson) {
    return {
      ok: false,
      result: { skipped: true, reason: "missing_service_account" },
    };
  }

  const serviceAccount = JSON.parse(serviceAccountJson) as Record<string, string>;
  const accessToken = await getFcmAccessToken(serviceAccount);
  const projectId = serviceAccount.project_id;

  const response = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        message: {
          token,
          notification: {
            title: payload.title,
            body: payload.body,
          },
          data: stringifyData(payload.data ?? {}),
          android: {
            priority: payload.priority === "high" ? "high" : "normal",
            // Short TTL for call notifications so stale alerts are not delivered
            ...(payload.channelId === "incoming_calls" && { ttl: "30s" }),
            notification: {
              priority: payload.priority === "high" ? "high" : "default",
              sound: "default",
              channel_id: payload.channelId ?? "default",
              // PUBLIC visibility so the caller name shows on the lock screen
              ...(payload.channelId === "incoming_calls" && {
                visibility: "PUBLIC",
                default_vibrate_timings: true,
              }),
            },
          },
          apns: {
            payload: {
              aps: {
                alert: {
                  title: payload.title,
                  body: payload.body,
                },
                "content-available": 1,
                sound: "default",
                category: payload.category ?? "NOTIFICATION",
              },
            },
          },
        },
      }),
    },
  );

  const result = await response.json();
  return {
    ok: response.ok,
    result,
  };
}
