import express from 'express';
import { enqueueMemberCreation } from '../services/ghostService.js';

const router = express.Router();

router.post('/create-free-member', async (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    await enqueueMemberCreation({
      type: 'free',
      data: { email, name }
    });
    
    res.status(202).json({
      success: true,
      message: 'Free member creation queued successfully'
    });
  } catch (err) {
    console.error('Error queuing free member:', err);
    res.status(500).json({ error: 'Failed to queue free member creation' });
  }
});

export default router;