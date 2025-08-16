import Stripe from 'stripe';
import env from '../config/env.js';

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export async function createCheckoutSession(priceId, name, email, productId, plan) {
  // Create customer with both name and metadata
  const customer = await stripe.customers.create({
    name,
    email,
    metadata: {
      productId,
      plan,
      formName: name
    }
  });

  // Create checkout session with prefilled details
  return stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer: customer.id,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${env.FRONTEND_URL}/success`,
    cancel_url: `${env.FRONTEND_URL}/cancel`,
    customer_details: {
      email: email, 
      name: name   
    },
    customer_update: {
      name: 'auto',
      address: 'auto'
    },
    payment_intent_data: {
      receipt_email: email, 
    },
    metadata: {
      productId,
      plan,
      formName: name
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