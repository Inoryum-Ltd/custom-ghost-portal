// config/env.js
import dotenv from 'dotenv';
dotenv.config();

export default {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3000,
  FRONTEND_URL: process.env.FRONTEND_URL,

  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,

  GHOST_ADMIN_URL: process.env.GHOST_ADMIN_URL,
  GHOST_ADMIN_API_KEY: process.env.GHOST_ADMIN_API_KEY
};