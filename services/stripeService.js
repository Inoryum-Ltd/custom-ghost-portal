import Stripe from 'stripe';
import env from '../config/env.js';

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil', // This is where the API version is set
});

export async function createCheckoutSession(priceId, name, email, productId, plan) {
  const customer = await stripe.customers.create({
    name,
    email,
    metadata: {
      productId,
      plan
    }
  });

  return stripe.checkout.sessions.create({
    mode: 'subscription',
    automatic_payment_methods: {
      enabled: true,
    },
    //payment_method_types: ['card', 'ideal'],
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