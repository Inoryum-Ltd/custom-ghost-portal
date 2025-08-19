import express from 'express';
import { enqueueMemberCreation } from '../services/ghostService.js';

const router = express.Router();

router.post('/create-comped-member', async (req, res) => {
  const { name, email, productId } = req.body;

  if (!name || !email || !productId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    await enqueueMemberCreation({
      type: 'comp',
      data: { email, name, productId }
    });
    
    res.status(202).json({
      success: true,
      message: 'Comp member creation queued successfully'
    });
  } catch (err) {
    console.error('Error queuing comp member:', err);
    res.status(500).json({ 
      error: 'Failed to queue comp member creation',
      details: err.message
    });
  }
});

export default router;