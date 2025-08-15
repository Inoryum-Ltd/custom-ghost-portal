// server.js
import express from 'express';
import bodyParser from 'body-parser';
import env from './config/env.js';
import checkoutRoutes from './routes/checkout.js';
import webhookRoutes from './routes/stripe-webhook.js';

const app = express();

// Normal JSON parser for normal routes
app.use('/start-checkout', bodyParser.json());

// Raw parser for Stripe webhook signature validation
app.use('/custom-membership-stripe-webhook', webhookRoutes);

// Routes
app.use(checkoutRoutes);

// Start server
app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
});