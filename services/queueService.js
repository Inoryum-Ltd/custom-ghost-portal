import { memberCreationQueue } from '../config/queue.js';
import logger from '../config/logger.js';

export async function enqueueMemberCreation(jobData) {
  try {
    const job = await memberCreationQueue.add('create-member', jobData, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000
      },
      removeOnComplete: true,
      removeOnFail: 3600 // Keep failed jobs for 1 hour
    });

    logger.info(`Member creation job enqueued`, { 
      jobId: job.id, 
      type: jobData.type,
      email: jobData.data.email ? `${jobData.data.email.substring(0, 3)}...` : 'unknown'
    });

    return job;
  } catch (error) {
    logger.error('Failed to enqueue member creation', {
      error: error.message,
      data: jobData
    });
    throw error;
  }
}