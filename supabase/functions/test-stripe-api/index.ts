import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
      action: "test-stripe-api",
      scope: `user:${context.user.id}`,
      limit: 20,
      windowMinutes: 15,
    });

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      throw new Error("Configuration unavailable");
    }

    const response = await fetch("https://api.stripe.com/v1/account", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (!response.ok) {
      throw new Error("Integration test failed");
    }

    const data = await response.json();

    return jsonResponse(req, {
      success: true,
      status: "active",
      message: "Stripe API is working correctly",
      accountId: data.id,
      country: data.country,
      currency: data.default_currency,
      businessProfile: data.business_profile?.name || "Not set",
    });
  } catch (error) {
    console.error("test-stripe-api error:", error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = getStatusCode(message);

    return jsonResponse(
      req,
      { error: status >= 500 ? "Request failed" : message, status: "error" },
      status,
    );
  }
});
