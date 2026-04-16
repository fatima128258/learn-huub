import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true
});

// Cache TTL (Time To Live) configurations in seconds
export const CACHE_TTL = {
  APPROVED_PLAYLISTS: 300, // 5 minutes
  PLAYLIST_DETAILS: 600, // 10 minutes
  PLAYLIST_ITEMS: 600, // 10 minutes
  INSTRUCTOR_PLAYLISTS: 180, // 3 minutes
  USER_PROFILE: 900 // 15 minutes
};

// Handle connection errors
redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

redis.on('connect', () => {
  console.log('Redis connected successfully');
});

export default redis;
