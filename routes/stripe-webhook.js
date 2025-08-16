// routes/stripe-webhook.js
import express from 'express';
import { constructStripeEvent, retrieveSubscription, retrieveCustomer } from '../services/stripeService.js';
import { createGhostMember } from '../services/ghostService.js';

const router = express.Router();

router.post(
  '/custom-membership-stripe-webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    let event;
    try {
      event = constructStripeEvent(req.body, req.headers['stripe-signature']);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      try {
        const session = event.data.object;

        // Extract info from metadata & customer if available
        let email = session.customer_details?.email;
        let name = session.metadata?.name;
        let productId = session.metadata?.productId;
        let plan = session.metadata?.plan;

        // If missing, fetch from Stripe (fallback)
        if (!email || !name) {
          const customer = await retrieveCustomer(session.customer);
          email = email || customer.email;
          name = name || customer.name;
        }

        // Always fetch subscription details
        const subscription = await retrieveSubscription(session.subscription);

        await createGhostMember({
          email,
          name,
          stripeCustomerId: session.customer,
          stripeSubscriptionId: subscription.id,
          productId,
          plan
        });

        console.log(`Ghost member created: ${email} (${plan} plan)`);
      } catch (err) {
        console.error('Error syncing with Ghost:', err);
      }
    }

    res.status(200).end();
  }
);

export default router;
