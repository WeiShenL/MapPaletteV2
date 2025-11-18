/**
 * Background Job Queue with Bull
 * Handles async operations like emails, notifications, image processing, etc.
 */

const Bull = require('bull');
const { createBullBoard } = require('@bull-board/api');
const { BullAdapter } = require('@bull-board/api/bullAdapter');
const { ExpressAdapter } = require('@bull-board/express');

// Redis connection for Bull
const redisConfig = {
  redis: process.env.REDIS_URL || 'redis://localhost:6379',
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 500, // Keep last 500 failed jobs for debugging
  },
};

/**
 * Create queues for different job types
 */
const queues = {
  email: new Bull('email-queue', redisConfig),
  notification: new Bull('notification-queue', redisConfig),
  imageProcessing: new Bull('image-processing-queue', redisConfig),
  analytics: new Bull('analytics-queue', redisConfig),
  cleanup: new Bull('cleanup-queue', redisConfig),
};

/**
 * Set up Bull Board UI for monitoring queues
 */
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: Object.values(queues).map((queue) => new BullAdapter(queue)),
  serverAdapter: serverAdapter,
});

/**
 * Email Queue Processors
 */
queues.email.process('welcome', async (job) => {
  const { email, username } = job.data;
  if (global.logger) {
    global.logger.info(`Sending welcome email to ${email}`);
  }
  // TODO: Implement actual email sending (SendGrid, AWS SES, etc.)
  // For now, just log
  await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate sending
  return { sent: true, email };
});

queues.email.process('password-reset', async (job) => {
  const { email, resetToken } = job.data;
  if (global.logger) {
    global.logger.info(`Sending password reset email to ${email}`);
  }
  // TODO: Implement actual email sending
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return { sent: true, email };
});

/**
 * Notification Queue Processors
 */
queues.notification.process('new-follower', async (job) => {
  const { userId, followerId } = job.data;
  if (global.logger) {
    global.logger.info(`Sending new follower notification to user ${userId}`);
  }
  // TODO: Implement push notification or in-app notification
  await new Promise((resolve) => setTimeout(resolve, 500));
  return { sent: true, userId };
});

queues.notification.process('new-comment', async (job) => {
  const { userId, postId, commentId } = job.data;
  if (global.logger) {
    global.logger.info(`Sending new comment notification to user ${userId}`);
  }
  // TODO: Implement notification
  await new Promise((resolve) => setTimeout(resolve, 500));
  return { sent: true, userId };
});

queues.notification.process('new-like', async (job) => {
  const { userId, postId, likerId } = job.data;
  if (global.logger) {
    global.logger.info(`Sending new like notification to user ${userId}`);
  }
  // TODO: Implement notification
  await new Promise((resolve) => setTimeout(resolve, 500));
  return { sent: true, userId };
});

/**
 * Image Processing Queue Processors
 */
queues.imageProcessing.process('optimize-profile-picture', async (job) => {
  const { userId, imageUrl } = job.data;
  if (global.logger) {
    global.logger.info(`Optimizing profile picture for user ${userId}`);
  }
  // TODO: Implement image optimization with Sharp
  // - Create thumbnail (150x150)
  // - Create medium (500x500)
  // - Convert to WebP
  // - Upload to storage
  await new Promise((resolve) => setTimeout(resolve, 2000));
  return { optimized: true, userId };
});

queues.imageProcessing.process('optimize-route-image', async (job) => {
  const { postId, imageUrl } = job.data;
  if (global.logger) {
    global.logger.info(`Optimizing route image for post ${postId}`);
  }
  // TODO: Implement image optimization
  await new Promise((resolve) => setTimeout(resolve, 2000));
  return { optimized: true, postId };
});

/**
 * Analytics Queue Processors
 */
queues.analytics.process('track-post-view', async (job) => {
  const { postId, userId, timestamp } = job.data;
  // TODO: Track post views for analytics
  // Could batch these and insert into analytics table
  await new Promise((resolve) => setTimeout(resolve, 100));
  return { tracked: true, postId };
});

queues.analytics.process('calculate-trending', async (job) => {
  if (global.logger) {
    global.logger.info('Calculating trending posts');
  }
  // TODO: Calculate trending posts based on recent interactions
  // Update trending cache in Redis
  await new Promise((resolve) => setTimeout(resolve, 3000));
  return { calculated: true };
});

/**
 * Cleanup Queue Processors
 */
queues.cleanup.process('delete-old-notifications', async (job) => {
  if (global.logger) {
    global.logger.info('Cleaning up old notifications');
  }
  // TODO: Delete notifications older than 30 days
  await new Promise((resolve) => setTimeout(resolve, 2000));
  return { deleted: true };
});

queues.cleanup.process('cleanup-expired-sessions', async (job) => {
  if (global.logger) {
    global.logger.info('Cleaning up expired sessions');
  }
  // TODO: Remove expired sessions from Redis
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return { cleaned: true };
});

/**
 * Scheduled/Cron Jobs
 */
const setupScheduledJobs = () => {
  // Calculate trending posts every hour
  queues.analytics.add(
    'calculate-trending',
    {},
    {
      repeat: {
        cron: '0 * * * *', // Every hour
      },
    }
  );

  // Cleanup old notifications daily at 2 AM
  queues.cleanup.add(
    'delete-old-notifications',
    {},
    {
      repeat: {
        cron: '0 2 * * *', // Daily at 2 AM
      },
    }
  );

  // Cleanup expired sessions every 6 hours
  queues.cleanup.add(
    'cleanup-expired-sessions',
    {},
    {
      repeat: {
        cron: '0 */6 * * *', // Every 6 hours
      },
    }
  );

  if (global.logger) {
    global.logger.info('Scheduled jobs setup complete');
  }
};

/**
 * Error handlers
 */
Object.values(queues).forEach((queue) => {
  queue.on('error', (error) => {
    if (global.logger) {
      global.logger.error(`Queue error in ${queue.name}:`, error);
    } else {
      console.error(`Queue error in ${queue.name}:`, error);
    }
  });

  queue.on('failed', (job, err) => {
    if (global.logger) {
      global.logger.error(`Job ${job.id} failed in ${queue.name}:`, {
        error: err.message,
        data: job.data,
        attemptsMade: job.attemptsMade,
      });
    } else {
      console.error(`Job ${job.id} failed in ${queue.name}:`, err);
    }
  });

  queue.on('completed', (job, result) => {
    if (global.logger) {
      global.logger.info(`Job ${job.id} completed in ${queue.name}`, {
        result,
        processingTime: job.finishedOn - job.processedOn,
      });
    }
  });
});

/**
 * Graceful shutdown
 */
const shutdown = async () => {
  if (global.logger) {
    global.logger.info('Closing all queues...');
  }
  await Promise.all(Object.values(queues).map((queue) => queue.close()));
  if (global.logger) {
    global.logger.info('All queues closed');
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

/**
 * Helper functions to add jobs
 */
const addJob = {
  // Email jobs
  sendWelcomeEmail: (email, username) =>
    queues.email.add('welcome', { email, username }),

  sendPasswordResetEmail: (email, resetToken) =>
    queues.email.add('password-reset', { email, resetToken }),

  // Notification jobs
  notifyNewFollower: (userId, followerId) =>
    queues.notification.add('new-follower', { userId, followerId }),

  notifyNewComment: (userId, postId, commentId) =>
    queues.notification.add('new-comment', { userId, postId, commentId }),

  notifyNewLike: (userId, postId, likerId) =>
    queues.notification.add('new-like', { userId, postId, likerId }),

  // Image processing jobs
  optimizeProfilePicture: (userId, imageUrl) =>
    queues.imageProcessing.add('optimize-profile-picture', { userId, imageUrl }),

  optimizeRouteImage: (postId, imageUrl) =>
    queues.imageProcessing.add('optimize-route-image', { postId, imageUrl }),

  // Analytics jobs
  trackPostView: (postId, userId) =>
    queues.analytics.add('track-post-view', {
      postId,
      userId,
      timestamp: Date.now(),
    }),
};

module.exports = {
  queues,
  serverAdapter,
  setupScheduledJobs,
  addJob,
  shutdown,
};
