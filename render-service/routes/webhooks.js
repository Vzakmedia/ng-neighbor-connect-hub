const express = require('express');
const Stripe = require('stripe');
const { getSupabaseClient } = require('../utils/supabase');

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Stripe webhook handler
 * POST /api/webhooks/stripe
 */
router.post('/stripe', async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    
    if (!signature) {
      return res.status(400).json({ error: 'No Stripe signature found' });
    }

    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log('Stripe event:', event.type);

    // Handle successful payment
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      console.log('Payment successful for session:', session.id);

      const supabase = getSupabaseClient();

      // Find and update the campaign
      const { data: campaign, error: campaignError } = await supabase
        .from('advertisement_campaigns')
        .select('*')
        .eq('stripe_session_id', session.id)
        .single();

      if (campaignError) {
        console.error('Campaign not found:', campaignError);
        return res.status(200).json({ received: true, warning: 'Campaign not found' });
      }

      console.log('Found campaign:', campaign.id);

      // Update campaign status
      const { error: updateError } = await supabase
        .from('advertisement_campaigns')
        .update({
          payment_status: 'paid',
          payment_completed_at: new Date().toISOString(),
          status: 'pending_approval',
          updated_at: new Date().toISOString()
        })
        .eq('id', campaign.id);

      if (updateError) {
        console.error('Error updating campaign:', updateError);
        throw updateError;
      }

      // Create notification for admins
      const { error: notificationError } = await supabase
        .from('alert_notifications')
        .insert({
          notification_type: 'ad_approval_needed',
          content: `New advertisement campaign "${campaign.campaign_name}" is awaiting approval`,
          sender_name: 'System',
          created_at: new Date().toISOString()
        });

      if (notificationError) {
        console.error('Error creating notification:', notificationError);
      }

      console.log('Campaign updated successfully');
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: error.message || 'Webhook processing failed' });
  }
});

module.exports = router;
