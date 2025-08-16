import express from 'express';
import { createFreeGhostMember } from '../services/ghostService.js';

const router = express.Router();

router.post('/create-free-member', async (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    await createFreeGhostMember({ email, name });
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error creating free member:', err);
    res.status(500).json({ error: 'Failed to create free member' });
  }
});

export default router;