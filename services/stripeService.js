// services/stripeService.js
import Stripe from 'stripe';
import env from '../config/env.js';

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export async function createCheckoutSession(priceId, name, email, productId, plan) {
  // Create customer first with metadata
  const customer = await stripe.customers.create({
    name,
    email,
    metadata: {
      productId,
      plan
    }
  });

  // Create checkout session linked to that customer
  return stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer: customer.id,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${env.FRONTEND_URL}/success`,
    cancel_url: `${env.FRONTEND_URL}/cancel`,
    metadata: {
      productId,
      plan,
      name
    }
  });
}

export async function retrieveSubscription(subscriptionId) {
  return stripe.subscriptions.retrieve(subscriptionId);
}

export async function retrieveCustomer(customerId) {
  return stripe.customers.retrieve(customerId);
}

export function constructStripeEvent(rawBody, signature) {
  return stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
}
