import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

interface RedisRetryOptions {
  error: Error | null;
  total_retry_time: number;
  attempt: number;
}

export class RedisService {
  private client: RedisClientType;
  private isConnected = false;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries: number) => {
          if (retries > 10) {
            return new Error('Too many Redis reconnection attempts');
          }
          return Math.min(retries * 100, 3000);
        },
      },
    });

    this.client.on('error', (err: Error) => {
      logger.error('Redis Client Error:', err);
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      logger.info('Redis Client Connected');
      this.isConnected = true;
    });

    this.client.on('ready', () => {
      logger.info('Redis Client Ready');
      this.isConnected = true;
    });

    this.client.on('end', () => {
      logger.info('Redis Client Disconnected');
      this.isConnected = false;
    });
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
      logger.info('✅ Redis connected successfully');
    } catch (error) {
      logger.error('❌ Redis connection failed:', error);
      // Continue without Redis for development
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.client.disconnect();
      logger.info('Redis disconnected');
    } catch (error) {
      logger.error('Error disconnecting Redis:', error);
    }
  }

  // Cache Management
  async get(key: string): Promise<string | null> {
    try {
      if (!this.isConnected) return null;
      const value = await this.client.get(key);
      if (value) {
        logger.debug(`Cache HIT: ${key}`);
      } else {
        logger.debug(`Cache MISS: ${key}`);
      }
      return value;
    } catch (error) {
      logger.error('Redis GET error:', error);
      return null;
    }
  }

  async set(key: string, value: string, ttl: number = 3600): Promise<boolean> {
    try {
      if (!this.isConnected) return false;
      await this.client.setEx(key, ttl, value);
      logger.debug(`Cache SET: ${key} (TTL: ${ttl}s)`);
      return true;
    } catch (error) {
      logger.error('Redis SET error:', error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      if (!this.isConnected) return false;
      await this.client.del(key);
      logger.debug(`Cache DELETE: ${key}`);
      return true;
    } catch (error) {
      logger.error('Redis DELETE error:', error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      if (!this.isConnected) return false;
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis EXISTS error:', error);
      return false;
    }
  }

  // Advanced caching patterns
  async getObject<T>(key: string): Promise<T | null> {
    try {
      const value = await this.get(key);
      if (value) {
        return JSON.parse(value) as T;
      }
      return null;
    } catch (error) {
      logger.error('Redis GET OBJECT error:', error);
      return null;
    }
  }

  async setObject<T>(key: string, value: T, ttl: number = 3600): Promise<boolean> {
    try {
      return await this.set(key, JSON.stringify(value), ttl);
    } catch (error) {
      logger.error('Redis SET OBJECT error:', error);
      return false;
    }
  }

  // List operations
  async listPush(key: string, value: string): Promise<number> {
    try {
      if (!this.isConnected) return 0;
      return await this.client.lPush(key, value);
    } catch (error) {
      logger.error('Redis LIST PUSH error:', error);
      return 0;
    }
  }

  async listPop(key: string): Promise<string | null> {
    try {
      if (!this.isConnected) return null;
      return await this.client.lPop(key);
    } catch (error) {
      logger.error('Redis LIST POP error:', error);
      return null;
    }
  }

  async listLength(key: string): Promise<number> {
    try {
      if (!this.isConnected) return 0;
      return await this.client.lLen(key);
    } catch (error) {
      logger.error('Redis LIST LENGTH error:', error);
      return 0;
    }
  }

  // Set operations
  async setAdd(key: string, value: string): Promise<number> {
    try {
      if (!this.isConnected) return 0;
      return await this.client.sAdd(key, value);
    } catch (error) {
      logger.error('Redis SET ADD error:', error);
      return 0;
    }
  }

  async setRemove(key: string, value: string): Promise<number> {
    try {
      if (!this.isConnected) return 0;
      return await this.client.sRem(key, value);
    } catch (error) {
      logger.error('Redis SET REMOVE error:', error);
      return 0;
    }
  }

  async setMembers(key: string): Promise<string[]> {
    try {
      if (!this.isConnected) return [];
      return await this.client.sMembers(key);
    } catch (error) {
      logger.error('Redis SET MEMBERS error:', error);
      return [];
    }
  }

  // Hash operations
  async hashSet(key: string, field: string, value: string): Promise<number> {
    try {
      if (!this.isConnected) return 0;
      return await this.client.hSet(key, field, value);
    } catch (error) {
      logger.error('Redis HASH SET error:', error);
      return 0;
    }
  }

  async hashGet(key: string, field: string): Promise<string | undefined> {
    try {
      if (!this.isConnected) return undefined;
      return await this.client.hGet(key, field);
    } catch (error) {
      logger.error('Redis HASH GET error:', error);
      return undefined;
    }
  }

  async hashGetAll(key: string): Promise<Record<string, string>> {
    try {
      if (!this.isConnected) return {};
      return await this.client.hGetAll(key);
    } catch (error) {
      logger.error('Redis HASH GET ALL error:', error);
      return {};
    }
  }

  // Pub/Sub operations
  async publish(channel: string, message: string): Promise<number> {
    try {
      if (!this.isConnected) return 0;
      return await this.client.publish(channel, message);
    } catch (error) {
      logger.error('Redis PUBLISH error:', error);
      return 0;
    }
  }

  // Performance monitoring
  async incrementCounter(key: string, amount: number = 1): Promise<number> {
    try {
      if (!this.isConnected) return 0;
      return await this.client.incrBy(key, amount);
    } catch (error) {
      logger.error('Redis INCREMENT error:', error);
      return 0;
    }
  }

  async getStats(): Promise<{
    connected: boolean;
    memory: string;
    keys: number;
    hits: number;
    misses: number;
  }> {
    try {
      if (!this.isConnected) {
        return {
          connected: false,
          memory: '0',
          keys: 0,
          hits: 0,
          misses: 0,
        };
      }

      const info = await this.client.info('memory');
      const keyCount = await this.client.dbSize();
      const stats = await this.client.info('stats');
      
      // Parse memory usage
      const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);
      const memory = memoryMatch ? memoryMatch[1] : '0';
      
      // Parse hit/miss stats
      const hitsMatch = stats.match(/keyspace_hits:(\d+)/);
      const missesMatch = stats.match(/keyspace_misses:(\d+)/);
      const hits = hitsMatch ? parseInt(hitsMatch[1]) : 0;
      const misses = missesMatch ? parseInt(missesMatch[1]) : 0;

      return {
        connected: this.isConnected,
        memory,
        keys: keyCount,
        hits,
        misses,
      };
    } catch (error) {
      logger.error('Redis STATS error:', error);
      return {
        connected: false,
        memory: '0',
        keys: 0,
        hits: 0,
        misses: 0,
      };
    }
  }

  // Cache patterns for common operations
  async cacheUserProfile(userId: number, profile: any, ttl: number = 1800): Promise<void> {
    await this.setObject(`user:${userId}:profile`, profile, ttl);
  }

  async getCachedUserProfile(userId: number): Promise<any | null> {
    return await this.getObject(`user:${userId}:profile`);
  }

  async cacheSkills(userId: number, skills: any[], ttl: number = 3600): Promise<void> {
    await this.setObject(`user:${userId}:skills`, skills, ttl);
  }

  async getCachedSkills(userId: number): Promise<any[] | null> {
    return await this.getObject(`user:${userId}:skills`);
  }

  async cacheSearchResults(query: string, results: any[], ttl: number = 600): Promise<void> {
    const key = `search:${Buffer.from(query).toString('base64')}`;
    await this.setObject(key, results, ttl);
  }

  async getCachedSearchResults(query: string): Promise<any[] | null> {
    const key = `search:${Buffer.from(query).toString('base64')}`;
    return await this.getObject(key);
  }

  async invalidateUserCache(userId: number): Promise<void> {
    await Promise.all([
      this.del(`user:${userId}:profile`),
      this.del(`user:${userId}:skills`),
      this.del(`user:${userId}:swaps`),
      this.del(`user:${userId}:notifications`),
    ]);
  }

  // Session management
  async storeSession(token: string, userId: number, ttl: number = 86400): Promise<void> {
    await this.setObject(`session:${token}`, { userId, createdAt: Date.now() }, ttl);
  }

  async getSession(token: string): Promise<{ userId: number; createdAt: number } | null> {
    return await this.getObject(`session:${token}`);
  }

  async deleteSession(token: string): Promise<void> {
    await this.del(`session:${token}`);
  }

  // Online users tracking
  async setUserOnline(userId: number): Promise<void> {
    await this.setAdd('online_users', userId.toString());
    await this.set(`user:${userId}:last_seen`, Date.now().toString(), 300);
  }

  async setUserOffline(userId: number): Promise<void> {
    await this.setRemove('online_users', userId.toString());
  }

  async getOnlineUsers(): Promise<number[]> {
    const users = await this.setMembers('online_users');
    return users.map(u => parseInt(u));
  }
}

// Export singleton instance
export const redisService = new RedisService();