import Queue from 'bull';

const connectionX = process.env.REDIS_URI || "";
const messageQueueSent = new Queue('messageQueueSent', connectionX, {
  redis: {
    retryStrategy: (times) => {
      const delay = Math.min(times * 100, 5000);
      return delay;
    },
    maxRetriesPerRequest: null
  }
});
console.log(messageQueueSent);
export default messageQueueSent;