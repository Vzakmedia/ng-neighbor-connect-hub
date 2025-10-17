const express = require('express');
const Stripe = require('stripe');
const { verifyAuth } = require('../middleware/auth');
const { getSupabaseClient } = require('../utils/supabase');

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Create payment session for ad campaign
 * POST /api/payments/ad-campaign
 */
router.post('/ad-campaign', verifyAuth, async (req, res) => {
  try {
    const { campaignId, totalAmount, currency = 'ngn', campaignName, duration } = req.body;
    const user = req.user;

    if (!campaignId || !totalAmount || !campaignName || !duration) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId = customers.data.length > 0 ? customers.data[0].id : undefined;

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: `Advertisement Campaign: ${campaignName}`,
              description: `${duration} day advertising campaign`,
            },
            unit_amount: Math.round(totalAmount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.origin}/advertising/campaigns?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/advertising/campaigns?payment=cancelled`,
      metadata: {
        campaign_id: campaignId,
        user_id: user.id,
      },
    });

    // Update campaign with payment session
    const supabase = getSupabaseClient();
    const { error: updateError } = await supabase
      .from('advertisement_campaigns')
      .update({
        stripe_session_id: session.id,
        payment_amount: totalAmount,
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
    res.status(400).json({ error: error.message || 'Payment creation failed' });
  }
});

/**
 * Create payment session for business promotion
 * POST /api/payments/business-promotion
 */
router.post('/business-promotion', verifyAuth, async (req, res) => {
  try {
    const { 
      businessId, 
      promotionType, 
      duration, 
      amount, 
      currency = 'ngn',
      description 
    } = req.body;
    const user = req.user;

    if (!businessId || !promotionType || !duration || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId = customers.data.length > 0 ? customers.data[0].id : undefined;

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: `Business Promotion: ${promotionType}`,
              description: description || `${duration} day business promotion`,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.origin}/business?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/business?payment=cancelled`,
      metadata: {
        business_id: businessId,
        promotion_type: promotionType,
        user_id: user.id,
      },
    });

    // Store promotion campaign
    const supabase = getSupabaseClient();
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + duration);

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
    res.status(400).json({ error: error.message || 'Payment creation failed' });
  }
});

module.exports = router;
