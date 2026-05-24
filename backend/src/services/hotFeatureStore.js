/**
 * Hot Feature Store Cache Engine
 * Provides sub-2ms lookups for sliding-window customer telemetry (velocity, prior declines)
 * Supports dynamic fallback between Redis and highly-optimized local memory.
 */
class HotFeatureStore {
  constructor() {
    this.memoryCache = new Map();
    this.redisClient = null;
    
    // Self-cleaning interval to purge expired cache tokens (sliding window) every 10 minutes
    setInterval(() => this.purgeExpiredKeys(), 10 * 60 * 1000);
  }

  // Increment transaction velocity inside sliding 1-hour window
  async incrementVelocity(cardHash, cleanCardNumber) {
    const key = `velocity:${cardHash || cleanCardNumber}`;
    const now = Date.now();
    const expiry = now + 60 * 60 * 1000; // 1-hour window

    if (this.redisClient && this.redisClient.connected) {
      try {
        await this.redisClient.zadd(key, now, now);
        await this.redisClient.zremrangebyscore(key, 0, now - 60 * 60 * 1000);
        await this.redisClient.expire(key, 3600);
        const count = await this.redisClient.zcard(key);
        return count;
      } catch (err) {
        console.warn("Feature Store: Redis write failed, using local fallback");
      }
    }

    // Local in-memory sliding window queue
    if (!this.memoryCache.has(key)) {
      this.memoryCache.set(key, []);
    }
    
    const timestamps = this.memoryCache.get(key);
    timestamps.push(now);
    
    // Filter timestamps in last hour
    const oneHourAgo = now - 60 * 60 * 1000;
    const activeTimestamps = timestamps.filter(t => t >= oneHourAgo);
    this.memoryCache.set(key, activeTimestamps);

    return activeTimestamps.length;
  }

  // Get current velocity in sliding window
  async getVelocity(cardHash, cleanCardNumber) {
    const key = `velocity:${cardHash || cleanCardNumber}`;
    const now = Date.now();

    if (this.redisClient && this.redisClient.connected) {
      try {
        await this.redisClient.zremrangebyscore(key, 0, now - 60 * 60 * 1000);
        const count = await this.redisClient.zcard(key);
        return count;
      } catch (err) {
        // Fallback
      }
    }

    if (!this.memoryCache.has(key)) return 0;
    const timestamps = this.memoryCache.get(key);
    const oneHourAgo = now - 60 * 60 * 1000;
    const active = timestamps.filter(t => t >= oneHourAgo);
    return active.length;
  }

  // Set card decline flag in hot feature store
  async flagDecline(cardHash, cleanCardNumber) {
    const key = `decline:${cardHash || cleanCardNumber}`;
    const expiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    if (this.redisClient && this.redisClient.connected) {
      try {
        await this.redisClient.setex(key, 86400, "1");
        return;
      } catch (err) {}
    }

    this.memoryCache.set(key, { value: 1, expiresAt: expiry });
  }

  // Check if card has recent declines
  async hasRecentDecline(cardHash, cleanCardNumber) {
    const key = `decline:${cardHash || cleanCardNumber}`;

    if (this.redisClient && this.redisClient.connected) {
      try {
        const val = await this.redisClient.get(key);
        return val ? 1 : 0;
      } catch (err) {}
    }

    if (!this.memoryCache.has(key)) return 0;
    const cache = this.memoryCache.get(key);
    if (Date.now() > cache.expiresAt) {
      this.memoryCache.delete(key);
      return 0;
    }
    return cache.value;
  }

  // In-memory garbage collection
  purgeExpiredKeys() {
    const now = Date.now();
    for (const [key, val] of this.memoryCache.entries()) {
      if (val.expiresAt && now > val.expiresAt) {
        this.memoryCache.delete(key);
      }
    }
  }
}

// Singleton instance
module.exports = new HotFeatureStore();
