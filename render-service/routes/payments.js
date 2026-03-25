const express = require('express');
const Stripe = require('stripe');
const { z } = require('zod');
const { verifyAuth } = require('../middleware/auth');
const { getSupabaseClient } = require('../utils/supabase');

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// ─── Validation schemas ────────────────────────────────────────────────────────
const ALLOWED_CURRENCIES = ['ngn', 'usd', 'gbp', 'eur'];
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const adCampaignSchema = z.object({
  campaignId: z.string().regex(uuidRegex, 'Invalid campaign ID format'),
  currency: z.enum(ALLOWED_CURRENCIES).default('ngn'),
});

const businessPromotionSchema = z.object({
  businessId: z.string().regex(uuidRegex, 'Invalid business ID format'),
  promotionType: z.enum(['basic', 'premium', 'featured']),
  duration: z.union([z.literal(7), z.literal(14), z.literal(30)]),
  currency: z.enum(ALLOWED_CURRENCIES).default('ngn'),
  description: z.string().max(200).optional(),
});
const BUSINESS_PROMOTION_PRICING = {
  basic: { 7: 5000, 14: 8000, 30: 14000 },
  premium: { 7: 10000, 14: 18000, 30: 32000 },
  featured: { 7: 20000, 14: 35000, 30: 60000 },
};

function getDurationDays(startDate, endDate) {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();

  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
    throw new Error('Invalid campaign schedule');
  }

  return Math.max(1, Math.ceil((end - start) / MS_PER_DAY));
}

function getSafeOrigin(req) {
  return req.headers.origin || process.env.APP_URL || 'http://localhost:5173';
}

async function getCustomerId(email) {
  const customers = await stripe.customers.list({ email, limit: 1 });
  return customers.data[0]?.id;
}

async function getCampaignPricing(supabase, campaignId, userId) {
  const { data: campaign, error: campaignError } = await supabase
    .from('advertisement_campaigns')
    .select('id, user_id, campaign_name, campaign_type, pricing_tier_id, target_geographic_scope, daily_budget, start_date, end_date')
    .eq('id', campaignId)
    .eq('user_id', userId)
    .single();

  if (campaignError || !campaign) {
    throw new Error('Campaign not found');
  }

  const { data: pricingTier, error: pricingTierError } = await supabase
    .from('ad_pricing_tiers')
    .select('id, ad_type, geographic_scope, base_price_per_day, max_duration_days, is_active')
    .eq('id', campaign.pricing_tier_id)
    .single();

  if (pricingTierError || !pricingTier || !pricingTier.is_active) {
    throw new Error('Pricing tier not found');
  }

  if (pricingTier.geographic_scope !== campaign.target_geographic_scope) {
    throw new Error('Campaign scope does not match the pricing tier');
  }

  if (campaign.campaign_type !== 'advertisement' && pricingTier.ad_type !== campaign.campaign_type) {
    throw new Error('Campaign type does not match the pricing tier');
  }

  const durationDays = getDurationDays(campaign.start_date, campaign.end_date);
  if (pricingTier.max_duration_days && durationDays > pricingTier.max_duration_days) {
    throw new Error('Campaign duration exceeds the pricing tier limit');
  }

  if (Number(campaign.daily_budget) < Number(pricingTier.base_price_per_day)) {
    throw new Error('Campaign budget is below the pricing tier minimum');
  }

  return {
    campaign,
    durationDays,
    amount: Number(campaign.daily_budget) * durationDays,
  };
}

function getBusinessPromotionAmount(promotionType, duration) {
  const numericDuration = Number(duration);
  const amount = BUSINESS_PROMOTION_PRICING[promotionType]?.[numericDuration];

  if (!amount) {
    throw new Error('Invalid promotion plan or duration');
  }

  return amount;
}

router.post('/ad-campaign', verifyAuth, async (req, res) => {
  try {
    const parsed = adCampaignSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });
    }
    const { campaignId, currency } = parsed.data;
    const user = req.user;

    const supabase = getSupabaseClient();
    const { campaign, durationDays, amount } = await getCampaignPricing(supabase, campaignId, user.id);
    const customerId = await getCustomerId(user.email);
    const origin = getSafeOrigin(req);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: `Advertisement Campaign: ${campaign.campaign_name}`,
              description: `${durationDays} day advertising campaign`,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/advertising/campaigns?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/advertising/campaigns?payment=cancelled`,
      metadata: {
        campaign_id: campaignId,
        user_id: user.id,
      },
    });

    const { error: updateError } = await supabase
      .from('advertisement_campaigns')
      .update({
        stripe_session_id: session.id,
        payment_amount: amount,
        status: 'pending_payment',
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId)
      .eq('user_id', user.id);

    if (updateError) {
      throw new Error(`Failed to update campaign: ${updateError.message}`);
    }

    res.json({
      url: session.url,
      sessionId: session.id
    });
  } catch (error) {
    console.error('Ad campaign payment error:', error);
    res.status(400).json({ error: 'Payment creation failed' });
  }
});

router.post('/business-promotion', verifyAuth, async (req, res) => {
  try {
    const parsed = businessPromotionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });
    }
    const { businessId, promotionType, duration, currency, description } = parsed.data;
    const user = req.user;

    const supabase = getSupabaseClient();
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, business_name, user_id')
      .eq('id', businessId)
      .eq('user_id', user.id)
      .single();

    if (businessError || !business) {
      throw new Error('Business not found');
    }

    const amount = getBusinessPromotionAmount(promotionType, duration);
    const customerId = await getCustomerId(user.email);
    const origin = getSafeOrigin(req);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: `Business Promotion: ${business.business_name}`,
              description: description || `${duration} day ${promotionType} business promotion`,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/business?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/business?payment=cancelled`,
      metadata: {
        business_id: businessId,
        promotion_type: promotionType,
        user_id: user.id,
      },
    });

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + Number(duration));

    const { error: insertError } = await supabase
      .from('promotion_campaigns')
      .insert({
        user_id: user.id,
        business_id: businessId,
        campaign_type: promotionType,
        payment_session_id: session.id,
        payment_amount: amount,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: 'pending_payment'
      });

    if (insertError) {
      throw new Error(`Failed to create promotion campaign: ${insertError.message}`);
    }

    res.json({
      url: session.url,
      sessionId: session.id
    });
  } catch (error) {
    console.error('Business promotion payment error:', error);
    res.status(400).json({ error: 'Payment creation failed' });
  }
});

module.exports = router;
