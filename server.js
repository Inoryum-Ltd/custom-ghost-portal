// server.js
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import env from './config/env.js';
import checkoutRoutes from './routes/checkout.js';
import webhookRoutes from './routes/stripe-webhook.js';
import freeMemberRoutes from './routes/free-member.js';
import compMemberRoutes from './routes/comp-member.js';

const app = express();

// Enable CORS for frontend domain
app.use(cors({
  origin: 'https://www.bkan.nl',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Raw parser for Stripe webhook signature validation
app.use('/custom-membership-stripe-webhook', webhookRoutes);


// Normal JSON parser for normal routes
app.use('/start-checkout', bodyParser.json());


// Free Members
app.use('/create-free-member', bodyParser.json());
app.use(freeMemberRoutes);


// freemium Members
app.use('/create-comped-member', bodyParser.json());
app.use(compMemberRoutes);


// Routes
app.use(checkoutRoutes);

// Start server
app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
});