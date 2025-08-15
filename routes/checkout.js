// routes/checkout.js
import express from 'express';
import tierMap from '../config/tierMap.js';
import { createCheckoutSession } from '../services/stripeService.js';

const router = express.Router();

router.post('/start-checkout', async (req, res) => {
  const { productId, plan, name, email } = req.body;

  if (!productId || !plan || !name || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!tierMap[productId] || !tierMap[productId][plan]) {
    return res.status(400).json({ error: 'Invalid product or plan' });
  }

  try {
    const priceId = tierMap[productId][plan];
    const session = await createCheckoutSession(priceId, name, email);
    res.json({ url: session.url });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

export default router;