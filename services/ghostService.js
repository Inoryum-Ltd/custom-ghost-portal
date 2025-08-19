import GhostAdminAPI from '@tryghost/admin-api';
import env from '../config/env.js';
import logger from '../config/logger.js';

const api = new GhostAdminAPI({
  url: env.GHOST_ADMIN_URL,
  key: env.GHOST_ADMIN_API_KEY,
  version: "v6.0"
});

export async function createGhostMember({ email, name, stripeCustomerId, stripeSubscriptionId, productId, plan }) {
  try {
    logger.info(`Creating paid member: ${email.substring(0, 3)}...@...`, { productId, plan });
    const result = await api.members.add({
      email,
      name,
      stripe_customer_id: stripeCustomerId,
      subscriptions: [
        { stripe_subscription_id: stripeSubscriptionId }
      ]
    });
    logger.info(`Paid member created for ${email.substring(0, 3)}...@...`, { productId, plan });
    return result;
  } catch (err) {
    logger.error(`Failed to create paid member ${email.substring(0, 3)}...@...`, {
      error: err.message,
      stack: err.stack,
      productId,
      plan
    });
    throw new Error(`Ghost API error: ${err.message}`);
  }
}

export async function createFreeGhostMember({ email, name }) {
  try {
    logger.info(`Creating free member: ${email.substring(0, 3)}...@...`);
    const result = await api.members.add({
      email,
      name,
    }, { send_email: true });
    logger.info(`Free member created for ${email.substring(0, 3)}...@...`);
    return result;
  } catch (err) {
    logger.error(`Failed to create free member ${email.substring(0, 3)}...@...`, {
      error: err.message,
      stack: err.stack
    });
    throw new Error(`Ghost API error: ${err.message}`);
  }
}

export async function createCompGhostMember({ email, name, productId }) {
  try {
    logger.info(`Creating comp member: ${email.substring(0, 3)}...@...`, { productId });
    const subscriptionData = {
      id: "",
      tier: { id: productId, active: true, expiry_at: null },
      plan: { id: "", nickname: "Complimentary", currency: "EUR", amount: 0 },
      status: "active",
      price: { id: "", price_id: "", nickname: "Complimentary", amount: 0, type: "recurring", currency: "EUR", tier: { id: "", tier_id: productId } },
      offer: null
    };

    const result = await api.members.add({
      email,
      name,
      tiers: [{ id: productId, expiry_at: null }],
      subscriptions: [subscriptionData],
    });
    logger.info(`Comp member created for ${email.substring(0, 3)}...@...`, { productId });
    return result;
  } catch (err) {
    logger.error(`Failed to create comp member ${email.substring(0, 3)}...@...`, {
      error: err.message,
      stack: err.stack,
      productId
    });
    throw new Error(`Ghost API error: ${err.message}`);
  }
}