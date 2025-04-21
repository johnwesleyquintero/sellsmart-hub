import bcrypt from 'bcrypt';
import crypto from 'crypto';
import Redis from 'ioredis';
import { NextResponse } from 'next/server';
import { connectToDatabase } from './mongodb';

const API_KEY_COLLECTION = 'apiKeys';
const KEY_ROTATION_INTERVAL = 30 * 24 * 60 * 60 * 1000; // 30 days in ms
const KEY_EXPIRATION = 90 * 24 * 60 * 60 * 1000; // 90 days in ms

const redis = new Redis(); // Connect to Redis

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5;

type ApiKeyRecord = {
  key: string;
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
  userId: string;
};

/**
 * Generates a new secure API key
 */
export async function generateApiKey(db: any): Promise<string> {
  let key: string;
  do {
    key = crypto.randomBytes(32).toString('hex');
  } while (await db.collection(API_KEY_COLLECTION).findOne({ key }));
  return key;
}

/**
 * Validates an API key against stored keys in MongoDB
 */
export async function validateApiKey(
  key: string,
  userId: string,
): Promise<boolean> {
  try {
    const { db } = await connectToDatabase();

    const apiKeyRecord = await db
      .collection<ApiKeyRecord>(API_KEY_COLLECTION)
      .findOne({
        userId: userId,
        key: key,
        isActive: true,
        expiresAt: { $gt: new Date() },
      });

    return !!apiKeyRecord;
  } catch (error: any) {
    console.error('Error validating API key:', error);
    return false;
  }
}

/**
 * Middleware for API key validation
 */
export async function apiKeyMiddleware(request: Request) {
  const apiKey = request.headers.get('x-api-key') || '';

  try {
    const requestBody = await request.json();
    const userId = requestBody.userId;

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId in request body' },
        { status: 400 },
      );
    }

    if (!(await validateApiKey(apiKey, userId))) {
      return NextResponse.json(
        { error: 'Invalid or expired API key' },
        { status: 401 },
      );
    }

    return null;
  } catch (error) {
    console.error('Error in apiKeyMiddleware:', error);
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 },
    );
  }
}

/**
 * Rotates API keys by generating new ones and deactivating old ones
 */
export async function rotateApiKeys(userId: string): Promise<ApiKeyRecord> {
  if (!(await isValidUserId(userId))) {
    throw new Error('Invalid userId format');
  }

  if (!isWithinRateLimit(userId)) {
    throw new Error('Rate limit exceeded');
  }
  const { db } = await connectToDatabase();
  try {
    // Acquire mutex
    const mutex = await acquireMutex(db, `rotateApiKeys:${userId}`);
    if (!mutex) {
      throw new Error(
        'Failed to acquire mutex. Another rotation is in progress.',
      );
    }

    try {
      // Deactivate all existing keys for the user
      await db
        .collection<ApiKeyRecord>(API_KEY_COLLECTION)
        .updateMany({ userId: userId }, { $set: { isActive: false } });
    } catch (error: any) {
      console.error('Error deactivating API keys:', error);
      throw error;
    } finally {
      // Release mutex
      await releaseMutex(db, `rotateApiKeys:${userId}`);
    }

    // Generate new key
    const newKey: ApiKeyRecord = {
      key: await bcrypt.hash(await generateApiKey(db), 10),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + KEY_EXPIRATION),
      isActive: true,
      userId: userId,
    };

    // Store the new key in the database
    try {
      await db.collection<ApiKeyRecord>(API_KEY_COLLECTION).insertOne(newKey);
    } catch (error: any) {
      console.error('Error inserting new API key:', error);
      throw error;
    }

    return newKey;
  } catch (error: any) {
    console.error('Error rotating API keys:', error);
    throw error;
  }
}

/**
 * Initializes API key management with first key for a user
 */
export async function initializeApiKeys(userId: string): Promise<void> {
  if (!(await isValidUserId(userId))) {
    throw new Error('Invalid userId format');
  }

  if (!isWithinRateLimit(userId)) {
    throw new Error('Rate limit exceeded');
  }
  try {
    const { db } = await connectToDatabase();
    const existingKey = await db
      .collection<ApiKeyRecord>(API_KEY_COLLECTION)
      .findOne({ userId: userId });

    if (!existingKey) {
      await rotateApiKeys(userId);
    }
  } catch (error: any) {
    console.error('Error initializing API keys:', error);
    throw error;
  }
}

/**
 * Gets an API key for a user
 */
export async function getApiKey(userId: string): Promise<ApiKeyRecord | null> {
  if (!(await isValidUserId(userId))) {
    console.warn('Invalid userId format');
    return null;
  }

  if (!isWithinRateLimit(userId)) {
    console.warn('Rate limit exceeded');
    return null;
  }
  try {
    const { db } = await connectToDatabase();
    const apiKey = await db
      .collection<ApiKeyRecord>(API_KEY_COLLECTION)
      .findOne({
        userId: userId,
        isActive: true,
        expiresAt: { $gt: new Date() },
      });
    return apiKey || null;
  } catch (error: any) {
    console.error('Error getting API key:', error);
    return null;
  }
}

/**
 * Deletes all API keys for a user
 */
export async function deleteApiKey(userId: string): Promise<void> {
  if (!(await isValidUserId(userId))) {
    throw new Error('Invalid userId format');
  }

  if (!isWithinRateLimit(userId)) {
    throw new Error('Rate limit exceeded');
  }
  try {
    const { db } = await connectToDatabase();
    await db
      .collection<ApiKeyRecord>(API_KEY_COLLECTION)
      .deleteMany({ userId: userId });
  } catch (error: any) {
    console.error('Error deleting API keys:', error);
    throw error;
  }
}

async function isValidUserId(userId: string): Promise<boolean> {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(userId)) {
    return false;
  }

  try {
    const { db } = await connectToDatabase();
    const user = await db.collection('users').findOne({ userId: userId });
    return !!user;
  } catch (error: any) {
    console.error('Error validating userId:', error);
    return false;
  }
}

async function isWithinRateLimit(userId: string): Promise<boolean> {
  const key = `rateLimit:${userId}`;
  const ttl = RATE_LIMIT_WINDOW / 1000; // TTL in seconds

  const count = await redis.incr(key);
  await redis.expire(key, ttl);

  return count <= MAX_REQUESTS_PER_WINDOW;
}

async function acquireMutex(db: any, key: string): Promise<boolean> {
  const now = new Date();
  const mutexTimeout = 60 * 1000; // Mutex timeout in milliseconds

  try {
    const result = await db.collection('mutexes').insertOne({
      key,
      locked: true,
      createdAt: now,
      expireAt: new Date(now.getTime() + mutexTimeout),
    });

    return result.acknowledged;
  } catch (error: any) {
    // Check if the error is due to a duplicate key (mutex already acquired)
    if (error.code === 11000) {
      return false; // Mutex already acquired
    }
    console.error('Error acquiring mutex:', error);
    return false;
  }
}

async function releaseMutex(db: any, key: string): Promise<void> {
  try {
    await db.collection('mutexes').deleteOne({ key });
  } catch (error: any) {
    console.error('Error releasing mutex:', error);
  }
}
