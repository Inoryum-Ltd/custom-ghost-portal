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

export async function createFreeGhostMember({ email, name }) {
  try {
    return await api.members.add({
      email,
      name,
    }, { send_email: true }); // Optional: send welcome email
  } catch (err) {
    throw new Error(`Ghost API error: ${err.message}`);
  }
}

export async function createCompGhostMember({ email, name, productId }) {

  // Base subscription data
  const subscriptionData = {
    id: "",
    tier: { id: productId, active: true, expiry_at: null },
    plan: { id: "", nickname: "Complimentary", currency: "EUR", amount: 0 },
    status: "active",
    price: { id: "", price_id: "", nickname: "Complimentary", amount: 0, type: "recurring", currency: "EUR", tier: { id: "", tier_id: productId } },
    offer: null
  };

  return api.members.add({
    email,
    name,
    tiers: [{ id: productId, expiry_at: null }],
    subscriptions: [subscriptionData],
  });
}