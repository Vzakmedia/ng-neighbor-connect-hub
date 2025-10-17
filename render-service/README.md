# Neighborhood Platform API - Node.js Microservice

A production-ready Node.js/Express microservice for payment processing and external integrations, designed to run on Render.

## Features

- ✅ Stripe payment processing for ad campaigns and business promotions
- ✅ Webhook handling for payment confirmations
- ✅ Supabase authentication via JWT verification
- ✅ Rate limiting and security headers
- ✅ CORS configuration
- ✅ Health check endpoint
- ✅ Error handling and logging

## Prerequisites

- Node.js 18+ 
- Stripe account
- Supabase project
- Render account (for deployment)

## Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your actual credentials
   ```

3. **Run the server:**
   ```bash
   npm run dev  # Development with auto-reload
   npm start    # Production
   ```

4. **Test the health endpoint:**
   ```bash
   curl http://localhost:3000/health
   ```

## API Endpoints

### Payments

#### Create Ad Campaign Payment
```http
POST /api/payments/ad-campaign
Authorization: Bearer <supabase-jwt-token>
Content-Type: application/json

{
  "campaignId": "uuid",
  "totalAmount": 50000,
  "currency": "ngn",
  "campaignName": "Summer Sale",
  "duration": 7
}
```

#### Create Business Promotion Payment
```http
POST /api/payments/business-promotion
Authorization: Bearer <supabase-jwt-token>
Content-Type: application/json

{
  "businessId": "uuid",
  "promotionType": "featured",
  "duration": 30,
  "amount": 25000,
  "currency": "ngn",
  "description": "Featured listing for 30 days"
}
```

### Webhooks

#### Stripe Webhook
```http
POST /api/webhooks/stripe
Stripe-Signature: <stripe-signature>
Content-Type: application/json

[Stripe event payload]
```

### Health Check
```http
GET /health
```

## Deployment to Render

### 1. Create New Web Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your Git repository
4. Configure:
   - **Name:** `neighborhood-platform-api`
   - **Environment:** `Node`
   - **Region:** Choose closest to your users
   - **Branch:** `main`
   - **Root Directory:** `render-service`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

### 2. Environment Variables

Add these in Render's Environment section:

```
NODE_ENV=production
ALLOWED_ORIGINS=https://yourdomain.com
SUPABASE_URL=https://cowiviqhrnmhttugozbz.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
STRIPE_SECRET_KEY=<your-stripe-secret-key>
STRIPE_WEBHOOK_SECRET=<your-webhook-secret>
```

### 3. Configure Stripe Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-render-url.onrender.com/api/webhooks/stripe`
3. Select events: `checkout.session.completed`
4. Copy webhook secret to environment variables

### 4. Update Frontend

Update your frontend to call the Render API instead of Supabase edge functions:

```typescript
// Before (Supabase Edge Function)
const { data } = await supabase.functions.invoke('create-ad-campaign-payment', {
  body: { campaignId, totalAmount, campaignName, duration }
});

// After (Render Microservice)
const response = await fetch('https://your-render-url.onrender.com/api/payments/ad-campaign', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`
  },
  body: JSON.stringify({ campaignId, totalAmount, campaignName, duration })
});
const data = await response.json();
```

## Production Considerations

### Performance
- Use Render's **Starter** plan or higher to avoid cold starts
- Enable auto-scaling for traffic spikes
- Consider adding Redis for caching

### Security
- Rotate API keys regularly
- Monitor failed authentication attempts
- Set up alerts for unusual activity
- Use environment variables for all secrets

### Monitoring
- Enable Render's logging
- Consider adding Sentry for error tracking
- Set up uptime monitoring (e.g., UptimeRobot)
- Monitor Stripe webhook delivery

### Costs
- Free tier: Cold starts, limited hours
- Starter ($7/mo): Always-on, no cold starts
- Standard ($25/mo): Better performance, more memory

## Testing Webhooks Locally

Use Stripe CLI to test webhooks:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger test events
stripe trigger checkout.session.completed
```

## Troubleshooting

### Authentication Errors
- Verify Supabase JWT token is valid
- Check `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- Ensure token is passed in `Authorization` header

### Webhook Failures
- Verify webhook signature matches
- Check `STRIPE_WEBHOOK_SECRET` is correct
- Review Stripe webhook logs

### CORS Errors
- Add your frontend domain to `ALLOWED_ORIGINS`
- Ensure preflight requests are handled

## Migration from Edge Functions

To migrate existing edge functions:

1. Move function logic to appropriate route files
2. Update authentication to use middleware
3. Update frontend to call new endpoints
4. Test thoroughly in staging
5. Update Stripe webhook URL
6. Deploy and monitor

## Support

For issues or questions:
- Check Render logs: `https://dashboard.render.com/web/[service-id]/logs`
- Review Stripe webhook logs
- Check Supabase database for data issues
