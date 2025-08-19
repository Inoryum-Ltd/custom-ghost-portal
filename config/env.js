import dotenv from 'dotenv';
dotenv.config();

export default {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3000,
  FRONTEND_URL: process.env.FRONTEND_URL,
  

  //Stripe
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,


  // Ghost admin configuration
  GHOST_ADMIN_URL: process.env.GHOST_ADMIN_URL,
  GHOST_ADMIN_API_KEY: process.env.GHOST_ADMIN_API_KEY,

  // Redis configuration
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  QUEUE_CONCURRENCY: parseInt(process.env.QUEUE_CONCURRENCY) || 5
};