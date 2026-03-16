import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getRequestContext } from "../_shared/auth.ts";
import { handleCors, jsonResponse } from "../_shared/http.ts";
import { enforceRateLimit } from "../_shared/rate-limit.ts";

function sanitizeFolderName(folder: string | undefined): string {
  if (!folder) return "uploads";

  const normalized = folder.trim().replace(/^\/+|\/+$/g, "");
  if (!normalized || !/^[a-z0-9/_-]+$/i.test(normalized)) {
    return "uploads";
  }

  return normalized;
}

function getStatusCode(message: string): number {
  if (message === "Unauthorized") return 401;
  if (message === "Rate limit exceeded") return 429;
  return 400;
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
      action: "generate-cloudinary-signature",
      scope: `user:${context.user.id}`,
      limit: 40,
      windowMinutes: 15,
    });

    const cloudinaryApiKey = Deno.env.get("CLOUDINARY_API_KEY");
    const cloudinaryApiSecret = Deno.env.get("CLOUDINARY_API_SECRET");
    if (!cloudinaryApiKey || !cloudinaryApiSecret) {
      throw new Error("Signature service unavailable");
    }

    const { folder } = await req.json() as { folder?: string };
    const userFolder = `${sanitizeFolderName(folder)}/${context.user.id}`;
    const timestamp = Math.round(Date.now() / 1000);
    const signatureString = `folder=${userFolder}&timestamp=${timestamp}${cloudinaryApiSecret}`;
    const hashBuffer = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(signatureString));
    const signature = Array.from(new Uint8Array(hashBuffer))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");

    return jsonResponse(req, {
      signature,
      timestamp,
      api_key: cloudinaryApiKey,
      folder: userFolder,
    });
  } catch (error) {
    console.error("generate-cloudinary-signature error:", error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = getStatusCode(message);

    return jsonResponse(
      req,
      { error: status >= 500 ? "Failed to generate signature" : message },
      status,
    );
  }
});
