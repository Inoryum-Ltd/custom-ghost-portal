import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import env from './config/env.js';
import checkoutRoutes from './routes/checkout.js';
import webhookRoutes from './routes/stripe-webhook.js';
import freeMemberRoutes from './routes/free-member.js';
import compMemberRoutes from './routes/comped-member.js';
import './workers/memberWorker.js';
import { connection } from './config/queue.js';
import logger from './config/logger.js';

const app = express();

// Enable CORS for frontend domain
app.use(cors({
  origin: '*',
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

// Comped Members
app.use('/create-comped-member', bodyParser.json());
app.use(compMemberRoutes);

// Routes
app.use(checkoutRoutes);

// Queue health check endpoint
app.get('/queue-health', async (req, res) => {
  try {
    const redisStatus = await connection.ping();
    res.json({ 
      status: 'healthy',
      redis: redisStatus === 'PONG' ? 'connected' : 'disconnected',
      queue: 'member-creation'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy',
      error: 'Queue system unavailable' 
    });
  }
});

// Redis error handling
connection.on('error', (error) => {
  logger.error('Redis connection error', { error: error.message });
});

connection.on('connect', () => {
  logger.info('Redis connected successfully');
});

// Start server
app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
});