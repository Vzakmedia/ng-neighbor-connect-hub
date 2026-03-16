const DEFAULT_DEV_ORIGINS = new Set([
  "http://localhost:3000",
  "http://localhost:4173",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:4173",
  "http://127.0.0.1:5173",
]);

function parseAllowedOrigins(): Set<string> {
  const configured = Deno.env.get("ALLOWED_ORIGINS") ?? "";
  const values = configured
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (values.length > 0) {
    return new Set(values);
  }

  const environment = Deno.env.get("DENO_ENV") ?? Deno.env.get("NODE_ENV") ?? "";
  if (environment.toLowerCase() === "production") {
    return new Set();
  }

  return new Set(DEFAULT_DEV_ORIGINS);
}

export function getRequestOrigin(req: Request): string | null {
  const origin = req.headers.get("origin")?.trim();
  return origin && origin.length > 0 ? origin : null;
}

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = getRequestOrigin(req);
  const allowedOrigins = parseAllowedOrigins();

  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, cache-control, x-webhook-signature, stripe-signature, x-internal-secret",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
  };

  if (origin && allowedOrigins.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Vary"] = "Origin";
  }

  return headers;
}

export function jsonResponse(
  req: Request,
  body: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...getCorsHeaders(req),
      "Content-Type": "application/json",
      ...extraHeaders,
    },
  });
}

export function handleCors(req: Request): Response | null {
  if (req.method !== "OPTIONS") {
    return null;
  }

  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(req),
  });
}

export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const [firstIp] = forwardedFor.split(",");
    if (firstIp?.trim()) {
      return firstIp.trim();
    }
  }

  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
