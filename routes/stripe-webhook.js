import express from 'express';
import { constructStripeEvent, retrieveSubscription, retrieveCustomer } from '../services/stripeService.js';
import { createGhostMember } from '../services/ghostService.js';
import logger from '../config/logger.js';

const router = express.Router();

const processPaidCheckout = async (session) => {
  let email = session.customer_details?.email;
  let name = session.metadata?.name;
  let productId = session.metadata?.productId;
  let plan = session.metadata?.plan;

  if (!email || !name) {
    const customer = await retrieveCustomer(session.customer);
    email = email || customer.email;
    name = name || customer.name;
  }

  if (!session.subscription) {
    logger.warn('No subscription found in session. This is not a subscription checkout.', { sessionId: session.id });
    return;
  }

  const subscription = await retrieveSubscription(session.subscription);

  // CRITICAL CHECK: Ensure the plan has a price greater than zero
  if (subscription.items.data.length > 0 && subscription.items.data[0].price.unit_amount > 0) {
    await createGhostMember({
      email,
      name,
      stripeCustomerId: session.customer,
      stripeSubscriptionId: subscription.id,
      productId,
      plan
    });
  } else {
    logger.info('Skipping paid member creation for a zero-amount subscription.');
  }
};

router.post(
  '/custom-membership-stripe-webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    let event;
    try {
      logger.info('Incoming Stripe webhook received');
      event = constructStripeEvent(req.body, req.headers['stripe-signature']);
      logger.debug('Stripe event constructed successfully', { eventType: event.type });
    } catch (err) {
      logger.error('Webhook signature verification failed', {
        error: err.message,
        stack: err.stack
      });
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      case 'checkout.session.completed':
        try {
          const session = event.data.object;
          if (session.payment_status === 'paid') {
            await processPaidCheckout(session);
          } else {
            logger.info(`Checkout session completed, but payment is not yet paid. Waiting for async_payment_succeeded. Session ID: ${session.id}`);
          }
        } catch (err) {
          logger.error('Error processing checkout.session.completed', { error: err.message, stack: err.stack });
        }
        break;

      case 'checkout.session.async_payment_succeeded':
        try {
          const session = event.data.object;
          logger.info(`Async payment succeeded for session: ${session.id}. Proceeding with member creation.`);
          await processPaidCheckout(session);
        } catch (err) {
          logger.error('Error processing checkout.session.async_payment_succeeded', { error: err.message, stack: err.stack });
        }
        break;

      default:
        logger.debug('Unhandled Stripe event type', { eventType: event.type });
    }

    res.status(200).end();
  }
);

export default router;