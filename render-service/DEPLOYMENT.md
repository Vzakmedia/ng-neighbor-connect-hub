# Render Deployment Guide

## Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **Stripe Account**: Get your API keys from [stripe.com/dashboard](https://dashboard.stripe.com)
3. **Supabase Credentials**: Your project URL and service role key

## Step 1: Local Testing

### Install Dependencies
```bash
cd render-service
npm install
```

### Configure Environment
Create a `.env` file in `render-service/`:
```env
NODE_ENV=development
PORT=3000
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:8080
SUPABASE_URL=https://cowiviqhrnmhttugozbz.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
STRIPE_SECRET_KEY=sk_test_your_stripe_test_key
STRIPE_WEBHOOK_SECRET=whsec_test_local_webhook_secret
```

### Start Development Server
```bash
npm run dev
```

The server will start at `http://localhost:3000`

### Test Endpoints
```bash
# Health check
curl http://localhost:3000/health

# Test ad campaign payment (requires auth token)
curl -X POST http://localhost:3000/api/payments/ad-campaign \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_TOKEN" \
  -d '{
    "campaignId": "campaign-id",
    "totalAmount": 10000,
    "campaignName": "Test Campaign",
    "duration": 7
  }'
```

## Step 2: Deploy to Render

### Option A: Deploy from GitHub (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Add Render microservice"
   git push origin main
   ```

2. **Create Web Service on Render**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure the service:
     - **Name**: `your-app-payment-service`
     - **Root Directory**: `render-service`
     - **Environment**: `Node`
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Instance Type**: Choose plan (Free tier available)

### Option B: Deploy from Render Dashboard Manually

1. Go to Render Dashboard
2. Create a new Web Service
3. Choose "Deploy from Git" or upload manually
4. Set root directory to `render-service`

## Step 3: Configure Environment Variables on Render

In your Render service dashboard, go to **Environment** tab and add:

```env
NODE_ENV=production
PORT=10000
ALLOWED_ORIGINS=https://your-frontend-domain.com,https://www.your-frontend-domain.com
SUPABASE_URL=https://cowiviqhrnmhttugozbz.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
STRIPE_SECRET_KEY=sk_live_your_stripe_live_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

**Important**: 
- Use your **production** Stripe keys
- Add all frontend domains to `ALLOWED_ORIGINS` (comma-separated)
- Keep `SUPABASE_SERVICE_ROLE_KEY` secret!

## Step 4: Update Frontend Environment Variables

In your main project's `.env` file:

```env
VITE_RENDER_API_URL=https://your-app-payment-service.onrender.com
```

**For production**, update this in your hosting platform (Netlify/Vercel):
```env
VITE_RENDER_API_URL=https://your-app-payment-service.onrender.com
```

## Step 5: Configure Stripe Webhook

1. **Go to Stripe Dashboard** → [Webhooks](https://dashboard.stripe.com/webhooks)
2. **Create New Endpoint**:
   - **Endpoint URL**: `https://your-app-payment-service.onrender.com/api/webhooks/stripe`
   - **Events to listen to**: Select `checkout.session.completed`
   - **API Version**: Latest
3. **Copy Webhook Secret** (starts with `whsec_`)
4. **Add to Render Environment Variables**:
   - Key: `STRIPE_WEBHOOK_SECRET`
   - Value: `whsec_...` (the secret you copied)

## Step 6: Test Production Deployment

### Test Health Endpoint
```bash
curl https://your-app-payment-service.onrender.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T12:00:00.000Z"
}
```

### Test Payment Flow
1. Go to your frontend application
2. Create a new advertisement campaign
3. Click "Pay & Start Campaign"
4. Complete Stripe checkout (use test card: `4242 4242 4242 4242`)
5. Verify campaign status updates to `pending_approval`

## Step 7: Monitor & Troubleshoot

### View Logs on Render
1. Go to your Render service dashboard
2. Click "Logs" tab
3. Monitor real-time logs for errors

### Common Issues

**CORS Errors**:
- Ensure `ALLOWED_ORIGINS` includes your frontend domain
- Check browser console for exact origin

**Authentication Errors**:
- Verify Supabase tokens are valid
- Check `SUPABASE_ANON_KEY` is correct

**Stripe Webhook Failures**:
- Verify webhook URL is correct
- Check `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
- Test webhook with Stripe CLI:
  ```bash
  stripe listen --forward-to https://your-app.onrender.com/api/webhooks/stripe
  ```

**Database Connection Issues**:
- Verify `SUPABASE_SERVICE_ROLE_KEY` has proper permissions
- Check Supabase project is active

## Step 8: Performance Optimization

### Upgrade from Free Tier
Free tier has:
- Cold starts (service sleeps after inactivity)
- Limited resources

For production:
1. Upgrade to **Starter** or **Standard** plan
2. Enables:
   - Always-on instances (no cold starts)
   - Better performance
   - More memory/CPU

### Enable Health Check Pings
To prevent cold starts on free tier:
- Use a service like [UptimeRobot](https://uptimerobot.com)
- Ping `/health` endpoint every 5 minutes

## Security Checklist

- ✅ Never commit `.env` files to Git
- ✅ Use environment variables for all secrets
- ✅ Enable CORS only for your domains
- ✅ Use HTTPS in production
- ✅ Regularly rotate API keys
- ✅ Monitor error logs for suspicious activity
- ✅ Keep dependencies updated: `npm audit fix`

## Monitoring & Analytics

### Set up Error Tracking
Consider integrating:
- [Sentry](https://sentry.io) for error monitoring
- [LogRocket](https://logrocket.com) for session replay
- [DataDog](https://datadoghq.com) for APM

### Add to server.js:
```javascript
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

## Backup & Disaster Recovery

1. **Database Backups**: Supabase handles this automatically
2. **Code Backups**: Use Git with multiple remotes
3. **Environment Variables**: Document in secure password manager

## Support

For issues:
1. Check Render logs first
2. Review Stripe webhook logs
3. Check Supabase logs
4. Contact support if needed

## Next Steps

- [ ] Deploy to Render
- [ ] Configure environment variables
- [ ] Set up Stripe webhook
- [ ] Test payment flow end-to-end
- [ ] Set up monitoring/alerting
- [ ] Document any custom configurations
