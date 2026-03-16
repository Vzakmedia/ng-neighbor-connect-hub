import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getRequestContext } from "../_shared/auth.ts";
import { handleCors, jsonResponse } from "../_shared/http.ts";
import { enforceRateLimit } from "../_shared/rate-limit.ts";

const CLOUDINARY_CLOUD_NAME = "dz1xpvm7p";

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
    if (!context.user) {
      throw new Error("Unauthorized");
    }

    await enforceRateLimit({
      admin: context.admin,
      action: "delete-cloudinary-image",
      scope: `user:${context.user.id}`,
      limit: 40,
      windowMinutes: 15,
    });

    const cloudinaryApiKey = Deno.env.get("CLOUDINARY_API_KEY");
    const cloudinaryApiSecret = Deno.env.get("CLOUDINARY_API_SECRET");
    if (!cloudinaryApiKey || !cloudinaryApiSecret) {
      throw new Error("Image deletion unavailable");
    }

    const { publicId } = await req.json() as { publicId?: string };
    if (!publicId) {
      throw new Error("Missing publicId");
    }

    const segments = String(publicId).split("/").filter(Boolean);
    if (segments.length < 3 || segments[1] !== context.user.id) {
      throw new Error("Forbidden");
    }

    const timestamp = Math.round(Date.now() / 1000);
    const signatureString = `public_id=${publicId}&timestamp=${timestamp}${cloudinaryApiSecret}`;
    const hashBuffer = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(signatureString));
    const signature = Array.from(new Uint8Array(hashBuffer))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");

    const formData = new FormData();
    formData.append("public_id", publicId);
    formData.append("signature", signature);
    formData.append("api_key", cloudinaryApiKey);
    formData.append("timestamp", timestamp.toString());

    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`, {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    return jsonResponse(req, {
      success: result.result === "ok",
      result: result.result ?? "unknown",
    });
  } catch (error) {
    console.error("delete-cloudinary-image error:", error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = getStatusCode(message);

    return jsonResponse(
      req,
      { error: status >= 500 ? "Failed to delete image" : message, success: false },
      status,
    );
  }
});
