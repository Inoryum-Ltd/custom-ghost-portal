import { Worker } from 'bullmq';
import { connection } from '../config/queue.js';
import { createGhostMember, createFreeGhostMember, createCompGhostMember } from '../services/ghostService.js';
import logger from '../config/logger.js';
import env from '../config/env.js';

const worker = new Worker('member-creation', async (job) => {
  const { type, data } = job.data;
  
  logger.info(`Processing member creation job ${job.id}`, { 
    type, 
    attempt: job.attemptsMade + 1,
    email: data.email ? `${data.email.substring(0, 3)}...` : 'unknown'
  });

  try {
    let result;
    switch (type) {
      case 'paid':
        result = await createGhostMember(data);
        break;
      case 'free':
        result = await createFreeGhostMember(data);
        break;
      case 'comp':
        result = await createCompGhostMember(data);
        break;
      case 'no-login': // <-- New case for the fake email feature
        result = await createNoLoginGhostMember(data);
         break;
      default:
        throw new Error(`Unknown member type: ${type}`);
    }
    
    logger.info(`Member creation job ${job.id} completed successfully`, {
      type,
      memberId: result.id
    });
    
    return result;
    
  } catch (error) {
    logger.error(`Member creation job ${job.id} failed`, {
      error: error.message,
      type,
      attempt: job.attemptsMade,
      data: job.data
    });
    throw error;
  }
}, { 
  connection,
  concurrency: env.QUEUE_CONCURRENCY
});

worker.on('completed', (job) => {
  logger.info(`Job ${job.id} completed successfully`);
});

worker.on('failed', (job, error) => {
  logger.error(`Job ${job.id} failed after ${job.attemptsMade} attempts`, {
    error: error.message,
    type: job.data.type
  });
});

worker.on('error', (error) => {
  logger.error('Worker error', { error: error.message });
});

export default worker;