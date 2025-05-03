import { Redis } from 'ioredis';
import { NextApiRequest, NextApiResponse } from 'next';

let redis: Redis;

try {
  redis = new Redis(process.env.UPSTASH_REDIS_REST_URL || '');
  redis.on('error', (err) => {
    console.error('Redis connection error:', err);
  });
} catch (err) {
  console.error('Failed to initialize Redis client:', err);
  redis = new Proxy({} as Redis, {
    get: () => () => {
      console.warn('Redis method called but Redis is not available');
      return null;
    },
  }) as Redis;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === 'GET') {
    const { key } = req.query;

    if (!key) {
      return res.status(400).json({ error: 'Key is required' });
    }

    try {
      const value = await redis.get(key as string);
      return res.status(200).json({ value });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to get value from Redis' });
    }
  } else if (req.method === 'POST') {
    const { key, value } = req.body;

    if (!key || !value) {
      return res.status(400).json({ error: 'Key and value are required' });
    }

    try {
      await redis.set(key, value);
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to set value in Redis' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
