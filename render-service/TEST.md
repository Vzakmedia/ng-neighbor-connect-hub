# Testing Guide for Render Payment Service

## Local Testing

### 1. Test Health Endpoint

```bash
curl http://localhost:3000/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T12:00:00.000Z"
}
```

### 2. Test Ad Campaign Payment Endpoint

First, get a Supabase auth token from your frontend application:
- Open browser DevTools → Application → Local Storage
- Find your Supabase session token

```bash
export AUTH_TOKEN="your_supabase_token_here"

curl -X POST http://localhost:3000/api/payments/ad-campaign \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "campaignId": "test-campaign-id",
    "totalAmount": 10000,
    "currency": "ngn",
    "campaignName": "Test Campaign",
    "duration": 7
  }'
```

**Expected Response:**
```json
{
  "url": "https://checkout.stripe.com/c/pay/cs_test_...",
  "sessionId": "cs_test_..."
}
```

### 3. Test Business Promotion Payment Endpoint

```bash
curl -X POST http://localhost:3000/api/payments/business-promotion \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "businessId": "test-business-id",
    "promotionType": "premium",
    "duration": 7,
    "amount": 10000,
    "currency": "ngn",
    "description": "Premium Promotion - 7 days"
  }'
```

**Expected Response:**
```json
{
  "url": "https://checkout.stripe.com/c/pay/cs_test_...",
  "sessionId": "cs_test_..."
}
```

### 4. Test Stripe Webhook (Local)

#### Option A: Use Stripe CLI

1. **Install Stripe CLI**:
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe
   
   # Windows
   # Download from https://github.com/stripe/stripe-cli/releases
   ```

2. **Login to Stripe**:
   ```bash
   stripe login
   ```

3. **Forward Webhooks to Local Server**:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

4. **Copy the webhook signing secret** displayed in the terminal

5. **Update your `.env` file**:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

6. **Trigger a test webhook**:
   ```bash
   stripe trigger checkout.session.completed
   ```

#### Option B: Use ngrok for Testing

1. **Install ngrok**: https://ngrok.com/download

2. **Start ngrok tunnel**:
   ```bash
   ngrok http 3000
   ```

3. **Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)

4. **Add to Stripe Dashboard**:
   - Go to [Stripe Webhooks](https://dashboard.stripe.com/test/webhooks)
   - Create new endpoint: `https://abc123.ngrok.io/api/webhooks/stripe`
   - Select event: `checkout.session.completed`

5. **Test by completing a checkout**

## Integration Testing with Frontend

### 1. Update Frontend `.env`

```env
VITE_RENDER_API_URL=http://localhost:3000
```

### 2. Start Both Services

**Terminal 1 - Backend:**
```bash
cd render-service
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### 3. Test Payment Flow

1. **Create a Campaign**:
   - Navigate to `/advertising` or create a post
   - Click "Promote"
   - Fill in campaign details
   - Click "Pay & Start Campaign"

2. **Complete Stripe Checkout**:
   - Use Stripe test card: `4242 4242 4242 4242`
   - Any future expiry date
   - Any 3-digit CVC

3. **Verify Database Updates**:
   - Check `advertisement_campaigns` table
   - Verify `payment_status` is `pending`
   - Verify `stripe_session_id` is set

4. **Simulate Webhook**:
   - Use Stripe CLI or dashboard to trigger webhook
   - Verify campaign status updates to `paid`

## Automated Testing

### Unit Tests (Future Enhancement)

Create `render-service/tests/payments.test.js`:

```javascript
const request = require('supertest');
const app = require('../server');

describe('Payment Endpoints', () => {
  let authToken;

  beforeAll(() => {
    // Set up test auth token
    authToken = 'test-token';
  });

  test('Health endpoint returns 200', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('healthy');
  });

  test('Ad campaign payment requires auth', async () => {
    const response = await request(app)
      .post('/api/payments/ad-campaign')
      .send({
        campaignId: 'test-id',
        totalAmount: 10000,
        campaignName: 'Test',
        duration: 7
      });
    
    expect(response.status).toBe(401);
  });

  // Add more tests...
});
```

### Load Testing

Use [Artillery](https://artillery.io) or [k6](https://k6.io):

```bash
npm install -g artillery

# Create artillery.yml
artillery quick --count 10 --num 100 http://localhost:3000/health
```

## Testing Checklist

### Pre-Deployment
- [ ] Health endpoint responds correctly
- [ ] CORS headers are properly configured
- [ ] Authentication middleware works
- [ ] Payment endpoints create valid Stripe sessions
- [ ] Database updates are successful
- [ ] Error handling works correctly

### Post-Deployment (Staging)
- [ ] All endpoints accessible via HTTPS
- [ ] Environment variables are correctly set
- [ ] CORS allows your frontend domain
- [ ] Stripe webhooks are received
- [ ] Database updates work in production
- [ ] Error logs are being captured

### Production Testing
- [ ] Complete end-to-end payment flow
- [ ] Verify webhook processing
- [ ] Check database consistency
- [ ] Monitor response times
- [ ] Verify error alerting works

## Common Test Scenarios

### 1. Successful Payment
- Create campaign → Complete payment → Verify webhook → Check status

### 2. Failed Payment
- Create campaign → Cancel checkout → Verify campaign remains in `draft`

### 3. Webhook Retry
- Temporarily break webhook handling → Stripe retries → Fix → Verify success

### 4. Concurrent Requests
- Create multiple campaigns simultaneously → Verify all process correctly

### 5. Invalid Data
- Send invalid campaign ID → Verify error handling
- Send negative amount → Verify validation

## Monitoring Test Results

### Check Render Logs
```bash
# Install Render CLI
npm install -g render-cli

# View logs
render logs -s your-service-name
```

### Check Stripe Dashboard
- [Payments](https://dashboard.stripe.com/test/payments)
- [Events](https://dashboard.stripe.com/test/events)
- [Webhooks](https://dashboard.stripe.com/test/webhooks)

### Check Supabase Logs
- Go to Supabase Dashboard → Logs
- Filter by table or API

## Troubleshooting Test Failures

### "CORS error"
- Add `http://localhost:5173` to `ALLOWED_ORIGINS`
- Clear browser cache

### "Authentication failed"
- Verify token is valid
- Check `SUPABASE_ANON_KEY` is correct

### "Stripe error"
- Use test API keys (start with `sk_test_`)
- Verify test mode is enabled

### "Webhook not received"
- Check webhook URL is correct
- Verify `STRIPE_WEBHOOK_SECRET` matches
- Use Stripe CLI to test locally

### "Database update failed"
- Check campaign exists
- Verify `SUPABASE_SERVICE_ROLE_KEY` has permissions
- Check table schema matches

## Performance Benchmarks

Expected response times (95th percentile):
- Health check: < 50ms
- Payment creation: < 500ms
- Webhook processing: < 200ms

If slower, check:
- Database query performance
- Network latency
- Render instance resources
