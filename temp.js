import { checkRedisConnection } from './src/lib/redis/config.ts';

async function run() {
  try {
    const isConnected = await checkRedisConnection();
    console.log('Redis connection status:', isConnected);
  } catch (error) {
    console.error('Error checking Redis connection:', error);
  }
}

run();
