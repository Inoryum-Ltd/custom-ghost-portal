import express from 'express';
import { enqueueMemberCreation } from '../services/ghostService.js';
import logger from '../config/logger.js';

const router = express.Router();

router.post('/create-no-login-member', async (req, res) => {
    const { email, name, note } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required.' });
    }

    try {
        const jobData = {
            type: 'no-login',
            data: { email, name, note }
        };

        const job = await enqueueMemberCreation(jobData);
        
        res.status(202).json({
            message: 'Member creation request accepted. Processing in background.',
            jobId: job.id
        });
    } catch (error) {
        logger.error('Failed to add no-login member job to queue', {
            error: error.message,
            email: email
        });
        res.status(500).json({ error: 'Failed to process request. Try again later.' });
    }
});

export default router;