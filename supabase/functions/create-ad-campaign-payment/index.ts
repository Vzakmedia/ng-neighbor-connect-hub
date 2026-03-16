import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { getRequestContext } from "../_shared/auth.ts";
import { handleCors, jsonResponse } from "../_shared/http.ts";
import { enforceRateLimit } from "../_shared/rate-limit.ts";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function getDurationDays(startDate: string, endDate: string): number {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();

  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
    throw new Error("Invalid campaign schedule");
  }

  return Math.max(1, Math.ceil((end - start) / MS_PER_DAY));
}

function getStatusCode(message: string): number {
  if (message === "Unauthorized") return 401;
  if (message === "Rate limit exceeded") return 429;
  if (message === "Campaign not found" || message === "Pricing tier not found") return 404;
  if (
    message.startsWith("Missing") ||
    message.startsWith("Invalid") ||
    message.includes("does not match") ||
    message.includes("exceeds") ||
    message.includes("below")
  ) {
    return 400;
  }
  return 500;
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    const context = await getRequestContext(req, { allowInternal: false, requireUser: true });
    if (!context.user?.email) {
      throw new Error("Unauthorized");
    }

    await enforceRateLimit({
      admin: context.admin,
      action: "create-ad-campaign-payment",
      scope: `user:${context.user.id}`,
      limit: 20,
      windowMinutes: 15,
    });

    const { campaignId, currency = "ngn" } = await req.json() as { campaignId?: string; currency?: string };
    if (!campaignId) {
      throw new Error("Missing campaignId");
    }

    const { data: campaign, error: campaignError } = await context.admin
      .from("advertisement_campaigns")
      .select("id, user_id, campaign_name, campaign_type, pricing_tier_id, target_geographic_scope, daily_budget, start_date, end_date")
      .eq("id", campaignId)
      .eq("user_id", context.user.id)
      .single();

    if (campaignError || !campaign) {
      throw new Error("Campaign not found");
    }

    const { data: pricingTier, error: pricingTierError } = await context.admin
      .from("ad_pricing_tiers")
      .select("id, ad_type, geographic_scope, base_price_per_day, max_duration_days, is_active")
      .eq("id", campaign.pricing_tier_id)
      .single();

    if (pricingTierError || !pricingTier || !pricingTier.is_active) {
      throw new Error("Pricing tier not found");
    }

    if (pricingTier.geographic_scope !== campaign.target_geographic_scope) {
      throw new Error("Campaign scope does not match the pricing tier");
    }

    if (campaign.campaign_type !== "advertisement" && pricingTier.ad_type !== campaign.campaign_type) {
      throw new Error("Campaign type does not match the pricing tier");
    }

    const durationDays = getDurationDays(campaign.start_date, campaign.end_date);
    if (pricingTier.max_duration_days && durationDays > pricingTier.max_duration_days) {
      throw new Error("Campaign duration exceeds the pricing tier limit");
    }

    if (Number(campaign.daily_budget) < Number(pricingTier.base_price_per_day)) {
      throw new Error("Campaign budget is below the pricing tier minimum");
    }

    const expectedTotalAmount = Number(campaign.daily_budget) * durationDays;
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const customers = await stripe.customers.list({ email: context.user.email, limit: 1 });
    const customerId = customers.data[0]?.id;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : context.user.email,
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: `Advertisement Campaign: ${campaign.campaign_name}`,
              description: `${durationDays} day advertising campaign`,
            },
            unit_amount: Math.round(expectedTotalAmount * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/advertising/campaigns?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/advertising/campaigns?payment=cancelled`,
      metadata: {
        campaign_id: campaignId,
        user_id: context.user.id,
      },
    });

    const { error: updateError } = await context.admin
      .from("advertisement_campaigns")
      .update({
        stripe_session_id: session.id,
        payment_amount: expectedTotalAmount,
        status: "pending_payment",
        updated_at: new Date().toISOString(),
      })
      .eq("id", campaignId)
      .eq("user_id", context.user.id);

    if (updateError) {
      throw new Error("Failed to update campaign payment session");
    }

    return jsonResponse(req, {
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error("create-ad-campaign-payment error:", error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = getStatusCode(message);

    return jsonResponse(
      req,
      { error: status >= 500 ? "Payment creation failed" : message },
      status,
    );
  }
});
