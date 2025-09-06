import express from 'express';
import { constructStripeEvent, retrieveSubscription, retrieveCustomer } from '../services/stripeService.js';
import { enqueueMemberCreation } from '../services/ghostService.js';
import logger from '../config/logger.js';

const router = express.Router();

router.post(
  '/custom-membership-stripe-webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    let event;
    try {
      logger.info('🔔 Stripe webhook received');
      event = constructStripeEvent(req.body, req.headers['stripe-signature']);
      logger.debug('Stripe event constructed successfully', { eventType: event.type });
    } catch (err) {
      logger.error('❌ Webhook signature verification failed', {
        error: err.message,
        stack: err.stack
      });
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // RESPOND IMMEDIATELY to Stripe - this is critical!
    res.status(200).json({ received: true });

    // Process the event asynchronously after responding
    processStripeEventAsync(event).catch(error => {
      logger.error('Async event processing failed', {
        error: error.message,
        eventId: event.id
      });
    });
  }
);

// Async function to process the event after responding to Stripe
async function processStripeEventAsync(event) {
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

       case 'checkout.session.async_payment_failed':
        try {
          const session = event.data.object;
          logger.warn(
            `❌ Async payment failed for session: ${session.id}, email: ${session.customer_details?.email}`
          );
          // optional: notify user, send email, or enqueue a failed-member event
        } catch (err) {
          logger.error(
            'Error processing checkout.session.async_payment_failed',
            { error: err.message, stack: err.stack }
          );
        }
      break;

    default:
      logger.debug('Unhandled Stripe event type', { eventType: event.type });
  }
}

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

  if (subscription.items.data.length > 0 && subscription.items.data[0].price.unit_amount > 0) {
    await enqueueMemberCreation({
      type: 'paid',
      data: {
        email,
        name,
        stripeCustomerId: session.customer,
        stripeSubscriptionId: subscription.id,
        productId,
        plan
      }
    });
  } else {
    logger.info('Skipping paid member creation for a zero-amount subscription.');
  }
};

export default router;