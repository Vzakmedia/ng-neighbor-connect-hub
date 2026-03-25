require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const paymentRoutes = require('./routes/payments');
const webhookRoutes = require('./routes/webhooks');

const app = express();
const PORT = process.env.PORT || 3000;
const configuredOrigins = process.env.ALLOWED_ORIGINS
  ?.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean) || [];
const defaultDevOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
];
const allowedOrigins = configuredOrigins.length > 0
  ? configuredOrigins
  : (process.env.NODE_ENV === 'production' ? [] : defaultDevOrigins);

app.use(helmet());

app.use(cors({
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true,
}));

let rateLimiterMiddleware;

async function initRateLimiter() {
  const upstashRedisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashRedisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (upstashRedisUrl && upstashRedisToken) {
    const { Ratelimit } = require('@upstash/ratelimit');
    const rateLimiter = new Ratelimit({
      redis: {
        url: upstashRedisUrl,
        token: upstashRedisToken,
      },
      limiter: Ratelimit.slidingWindow(100, '15 m'),
      analytics: true,
    });

    rateLimiterMiddleware = async (req, res, next) => {
      const identifier = req.ip || req.headers['x-forwarded-for'] || 'unknown';
      const { success } = await rateLimiter.limit(identifier);

      if (!success) {
        res.set('Retry-After', '900');
        return res.status(429).json({
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
        });
      }
      next();
    };
    console.log('[RateLimit] Using Upstash Redis backend');
  } else {
    const rateLimit = require('express-rate-limit');
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
    });
    rateLimiterMiddleware = limiter;
    console.warn('[RateLimit] Using in-memory backend (not recommended for production)');
  }
}

(async () => {
  await initRateLimiter();
  app.use(rateLimiterMiddleware);
})();

app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.use('/api/payments', paymentRoutes);
app.use('/api/webhooks', webhookRoutes);

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`[Render] Server running on port ${PORT}`);
  console.log(`[Render] Environment: ${process.env.NODE_ENV || 'development'}`);
  if (configuredOrigins.length === 0) {
    console.warn('[CORS] ALLOWED_ORIGINS is not set. Only the built-in development origins are allowed.');
  }
});
