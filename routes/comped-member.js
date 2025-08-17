import express from 'express';
import { createCompGhostMember } from '../services/ghostService.js';

const router = express.Router();

router.post('/create-comped-member', async (req, res) => {
  const { name, email, productId } = req.body;

  if (!name || !email || !productId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    await createCompGhostMember({ email, name, productId });
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error creating comp member:', err);
    res.status(500).json({ 
      error: 'Failed to create comp member',
      details: err.message // Optional: include for debugging
    });
  }
});

export default router;