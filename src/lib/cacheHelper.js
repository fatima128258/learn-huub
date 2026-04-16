import redis, { CACHE_TTL } from './redis';

export const cacheHelper = {
  // Get cached data
  async get(key) {
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  // Set cached data
  async set(key, data, ttl = CACHE_TTL.APPROVED_PLAYLISTS) {
    try {
      await redis.setex(key, ttl, JSON.stringify(data));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  },

  // Delete cached data
  async del(key) {
    try {
      await redis.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  },

  // Delete multiple keys by pattern
  async delPattern(pattern) {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error('Cache delete pattern error:', error);
    }
  },

  // Generate cache keys
  keys: {
    approvedPlaylists: () => 'playlists:approved',
    playlistDetails: (id) => `playlist:${id}`,
    playlistItems: (id) => `playlist:${id}:items`,
    instructorPlaylists: (instructorId) => `instructor:${instructorId}:playlists`,
    studentPlaylists: (studentId) => `student:${studentId}:playlists`,
    allPlaylists: () => 'playlists:all'
  }
};
