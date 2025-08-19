import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import env from './env.js';

const connection = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false
});

// Create queues
export const memberCreationQueue = new Queue('member-creation', { connection });
export { connection };