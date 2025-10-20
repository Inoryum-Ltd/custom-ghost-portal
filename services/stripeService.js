import Stripe from 'stripe';
import env from '../config/env.js';

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil',
});

export async function createCheckoutSession(priceId, name, email, productId, plan) {
  // 1. Create a new Customer with name and email
  const customer = await stripe.customers.create({
    name,
    email,
    metadata: {
      productId,
      plan
    }
  });

  // 2. Create the Checkout Session with automatic_tax enabled and best practices
  return stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card', 'ideal'],
    customer: customer.id,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${env.FRONTEND_URL}/success`,
    cancel_url: `${env.FRONTEND_URL}/cancel`,
    metadata: {
      productId,
      plan,
      name
    },

    // 1. ADD THIS LINE: Force billing address collection
    billing_address_collection: 'required', // or 'auto'
    
    // 💡 REQUIRED: Enable automatic tax calculation (Stripe Tax)
    automatic_tax: {
      enabled: true, 
    },

    // collected in Checkout for more accurate tax calculation.
    customer_update: {
      address: 'auto',
      name: 'auto'
    },

    // for B2B tax compliance and exemptions.
    tax_id_collection: {
      enabled: true,
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