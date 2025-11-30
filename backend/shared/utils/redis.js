const Redis = require('ioredis');

let redis = null;

const getRedisClient = () => {
  if (redis) return redis;

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.warn('[REDIS] No Redis URL configured. Caching disabled.');
    return null;
  }

  try {
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
    });

    redis.on('error', (err) => console.error('[REDIS] Error:', err));
    redis.on('connect', () => console.log('[REDIS] Connected'));

    return redis;
  } catch (error) {
    console.error('[REDIS] Init failed:', error);
    return null;
  }
};

const cache = {
  async get(key) {
    const client = getRedisClient();
    if (!client) return null;
    try {
      const value = await client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`[REDIS] Get error for ${key}:`, error);
      return null;
    }
  },

  async set(key, value, ttlSeconds = 300) {
    const client = getRedisClient();
    if (!client) return false;
    try {
      await client.setex(key, ttlSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`[REDIS] Set error for ${key}:`, error);
      return false;
    }
  },

  async del(key) {
    const client = getRedisClient();
    if (!client) return false;
    try {
      await client.del(key);
      return true;
    } catch (error) {
      console.error(`[REDIS] Del error for ${key}:`, error);
      return false;
    }
  },

  async delPattern(pattern) {
    const client = getRedisClient();
    if (!client) return false;
    try {
      const keys = await client.keys(pattern);
      if (keys.length > 0) await client.del(...keys);
      return true;
    } catch (error) {
      console.error(`[REDIS] DelPattern error for ${pattern}:`, error);
      return false;
    }
  },
};

module.exports = { getRedisClient, cache };
