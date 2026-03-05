import Redis from 'ioredis';

let _redis: Redis | null = null;

function getRedis(): Redis | null {
  if (!process.env.REDIS_URL) return null;
  if (!_redis) {
    _redis = new Redis(process.env.REDIS_URL);
  }
  return _redis;
}

export default getRedis;
