// services/ghostService.js
import GhostAdminAPI from '@tryghost/admin-api';
import env from '../config/env.js';

const api = new GhostAdminAPI({
  url: env.GHOST_ADMIN_URL,
  key: env.GHOST_ADMIN_API_KEY,
  version: "v6.0"
});

export async function createGhostMember({ email, name, stripeCustomerId, stripeSubscriptionId }) {
  try {
    return await api.members.add({
      email,
      name,
      stripe_customer_id: stripeCustomerId,
      subscriptions: [
        { stripe_subscription_id: stripeSubscriptionId }
      ]
    });
  } catch (err) {
    throw new Error(`Ghost API error: ${err.message}`);
  }
}