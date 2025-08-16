// server.js
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import env from './config/env.js';
import checkoutRoutes from './routes/checkout.js';
import webhookRoutes from './routes/stripe-webhook.js';
import freeMemberRoutes from './routes/free-member.js';

const app = express();

// Enable CORS for frontend domain
app.use(cors({
  origin: 'https://www.bkan.nl',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Normal JSON parser for normal routes
app.use('/start-checkout', bodyParser.json());


// Free Members
app.use('/create-free-member', bodyParser.json());
app.use(freeMemberRoutes);


// Raw parser for Stripe webhook signature validation
app.use('/custom-membership-stripe-webhook', webhookRoutes);

// Routes
app.use(checkoutRoutes);

// Start server
app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
});