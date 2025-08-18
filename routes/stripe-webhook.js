import express from 'express';
import { constructStripeEvent, retrieveSubscription, retrieveCustomer } from '../services/stripeService.js';
import { createGhostMember } from '../services/ghostService.js';
import logger from '../config/logger.js';

const router = express.Router();

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

    if (event.type === 'checkout.session.completed') {
      try {
        const session = event.data.object;
        logger.info('Processing checkout.session.completed event', {
          sessionId: session.id,
          customer: session.customer
        });

        // Extract info from metadata & customer if available
        let email = session.customer_details?.email;
        let name = session.metadata?.name;
        let productId = session.metadata?.productId;
        let plan = session.metadata?.plan;

        logger.debug('Extracted session metadata', {
          emailPresent: !!email,
          namePresent: !!name,
          productId,
          plan
        });

        // If missing, fetch from Stripe (fallback)
        if (!email || !name) {
          logger.debug('Missing email or name, fetching customer from Stripe');
          const customer = await retrieveCustomer(session.customer);
          email = email || customer.email;
          name = name || customer.name;
        }

        // Always fetch subscription details
        logger.debug('Fetching subscription details');
        const subscription = await retrieveSubscription(session.subscription);

        logger.info('Creating Ghost member', {
          email: email?.substring(0, 3) + '...@...' + email?.split('@')[1]?.substring(0, 3),
          name: name?.substring(0, 2) + '...',
          productId,
          plan
        });

        await createGhostMember({
          email,
          name,
          stripeCustomerId: session.customer,
          stripeSubscriptionId: subscription.id,
          productId,
          plan
        });

        logger.info(`Ghost member created: ${email?.substring(0, 3)}... (${plan} plan)`);
      } catch (err) {
        logger.error('Error syncing with Ghost', {
          error: err.message,
          stack: err.stack,
          eventType: event.type
        });
      }
    } else {
      logger.debug('Unhandled Stripe event type', { eventType: event.type });
    }

    res.status(200).end();
  }
);

export default router;