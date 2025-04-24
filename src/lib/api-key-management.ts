import bcrypt from 'bcrypt';
import Redis from 'ioredis';
import type { Db } from 'mongodb'; // Import Db and ObjectId types
import { NextResponse } from 'next/server';
import crypto from 'node:crypto'; // Fix: Use node:crypto protocol
import { logger } from './logger';
import { connectToDatabase } from './mongodb';

const API_KEY_COLLECTION = 'apiKeys';

// Note: Index creation should typically be done once, either manually via mongo shell
// or using an ODM/migration tool, not on every application start within the code.
// Example (conceptual - don't run this directly in application code):
// db.collection(API_KEY_COLLECTION).createIndex({ userId: 1, isActive: 1, expiresAt: 1 });

const KEY_EXPIRATION = 90 * 24 * 60 * 60 * 1000; // 90 days in ms

// Key security enhancements
const CRYPTO_CONFIG = {
  keyLength: 32, // 256-bit entropy
  keyEncoding: 'hex' as const,
  hashRounds: 12, // BCrypt cost factor
};

// Enhanced Redis configuration
const redis = new Redis({
  retryStrategy: (times) => Math.min(times * 100, 3000),
  maxRetriesPerRequest: 3,
  connectTimeout: 5000,
  enableAutoPipelining: true,
});

// Note: The optimized MongoDB query with hint is shown conceptually below.
// It should be used within the actual function calls where the query is made.
/*
Conceptual Example:
db.collection(API_KEY_COLLECTION)
  .findOne({
    userId, // userId needs to be defined in the scope where this is called
    isActive: true,
    expiresAt: { $gt: new Date() }
  })
  .hint('userId_1_isActive_1_expiresAt_1'); // Force index usage
*/

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5;

type ApiKeyRecord = {
  key: string; // This will store the HASHED key
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
  userId: string;
};

// Define a minimal interface for the User document, assuming _id is a string (UUID)
interface UserDocument {
  _id: string; // Assuming _id is the string userId based on UUID validation
  // other user fields...
}

/**
 * Generates a new secure API key (plain text)
 */
export async function generateApiKey(): Promise<string> {
  // 256-bit entropy (32 bytes) provides sufficient uniqueness
  return crypto
    .randomBytes(CRYPTO_CONFIG.keyLength)
    .toString(CRYPTO_CONFIG.keyEncoding);
}

/**
 * Validates a plain text API key against the stored hash in MongoDB
 */
export async function validateApiKey(
  plainKey: string,
  userId: string,
): Promise<boolean> {
  // Outer try-catch for connection errors or unexpected issues
  try {
    const { db } = await connectToDatabase();

    // Inner try-catch specifically for the database query and comparison logic
    try {
      const apiKeyRecord = await db
        .collection<ApiKeyRecord>(API_KEY_COLLECTION)
        .findOne(
          {
            userId: userId,
            isActive: true,
            expiresAt: { $gt: new Date() },
          },
          // Optional: Add hint if performance analysis shows it's needed
          // { hint: 'userId_1_isActive_1_expiresAt_1' }
        );

      if (!apiKeyRecord) {
        logger.warn('No active API key found for validation', { userId });
        return false;
      }

      // Compare the provided plain text key with the stored hash
      const isValid = await bcrypt.compare(plainKey, apiKeyRecord.key);
      if (!isValid) {
        logger.warn('API key validation failed: Mismatch', { userId });
      }
      return isValid;
    } catch (error: unknown) {
      logger.error('API Key Validation DB Error', {
        error: error instanceof Error ? error.message : 'UnknownError',
        userId,
        keySnippet: plainKey.slice(0, 4) + '***' + plainKey.slice(-4),
      });
      return false;
    }
  } catch (connectionError: unknown) {
    // Catch errors from connectToDatabase() or other issues outside the inner try
    logger.error('API Key Validation Connection/Setup Error', {
      error:
        connectionError instanceof Error
          ? connectionError.message
          : 'UnknownError',
      userId,
    });
    return false;
  }
}

/**
 * Middleware for API key validation
 */
export async function apiKeyMiddleware(request: Request) {
  const apiKey = request.headers.get('x-api-key') || '';

  try {
    // Clone the request to allow reading the body here and in the route handler
    const clonedRequest = request.clone();
    const requestBody = await clonedRequest.json();
    const userId = requestBody.userId; // Assuming userId is present in the body

    if (!userId) {
      logger.warn('apiKeyMiddleware: Missing userId in request body');
      return NextResponse.json(
        { error: 'Missing userId in request body' },
        { status: 400 },
      );
    }

    // Basic validation for userId format before hitting the DB
    if (typeof userId !== 'string' || !isValidUserIdFormat(userId)) {
      logger.warn('apiKeyMiddleware: Invalid userId format in request body', {
        userId,
      });
      return NextResponse.json(
        { error: 'Invalid userId format' },
        { status: 400 },
      );
    }

    // Validate the API key (this involves bcrypt comparison)
    if (!(await validateApiKey(apiKey, userId))) {
      logger.warn('apiKeyMiddleware: Invalid or expired API key', { userId });
      return NextResponse.json(
        { error: 'Invalid or expired API key' },
        { status: 401 },
      );
    }

    // If validation passes, return undefined to allow the original request to proceed.
    logger.info('apiKeyMiddleware: API key validated successfully', { userId });
    return undefined;
  } catch (error) {
    logger.error('Error in apiKeyMiddleware', { error });
    // Check if the error is due to JSON parsing
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 },
      );
    }
    // Generic error for other issues
    return NextResponse.json(
      { error: 'Internal server error during API key validation' },
      { status: 500 }, // Use 500 for server errors
    );
  }
}

/**
 * Rotates API keys by generating a new one and deactivating old ones.
 * Returns the new ApiKeyRecord containing the *hashed* key, along with the *plain text* key.
 */
export async function rotateApiKeys(
  userId: string,
): Promise<{ record: ApiKeyRecord; plainKey: string }> {
  if (!(await isValidUserId(userId))) {
    throw new Error('Invalid userId format or user not found');
  }

  if (!(await isWithinRateLimit(`rotate:${userId}`))) {
    // Use specific key for rotation rate limit
    throw new Error('Rate limit exceeded for API key rotation');
  }

  const { db } = await connectToDatabase();
  const lockKey = `mutex:rotateApiKeys:${userId}`;
  const mutexAcquired = await acquireMutex(db, lockKey);
  if (!mutexAcquired) {
    throw new Error(
      'Failed to acquire lock. Another rotation might be in progress.',
    );
  }

  try {
    // Deactivate all existing keys for the user inside the mutex lock
    const updateResult = await db
      .collection<ApiKeyRecord>(API_KEY_COLLECTION)
      .updateMany(
        { userId: userId, isActive: true },
        { $set: { isActive: false } },
      );
    logger.info(
      `Deactivated ${updateResult.modifiedCount} old keys for user ${userId}`,
    );

    // Generate new plain text key
    const plainKey = await generateApiKey();
    // Hash the key for storage
    const hashedKey = await bcrypt.hash(plainKey, CRYPTO_CONFIG.hashRounds);

    const newKeyRecord: ApiKeyRecord = {
      key: hashedKey, // Store the hashed key
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + KEY_EXPIRATION),
      isActive: true,
      userId: userId,
    };

    // Store the new key record in the database
    await db
      .collection<ApiKeyRecord>(API_KEY_COLLECTION)
      .insertOne(newKeyRecord);
    logger.info(
      `Successfully generated and stored new API key for user ${userId}`,
    );

    // Return the record (with hashed key) AND the plain text key separately
    return { record: newKeyRecord, plainKey: plainKey };
  } catch (error: unknown) {
    const isMongoError =
      error &&
      typeof error === 'object' &&
      'name' in error &&
      error.name === 'MongoError';
    logger.error('KeyRotationFailed', {
      userId,
      error: error instanceof Error ? error.stack : 'Unknown error',
      retryable:
        isMongoError &&
        'hasErrorLabel' in error &&
        typeof error.hasErrorLabel === 'function' &&
        error.hasErrorLabel('RetryableWriteError'),
    });
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Unknown error during key rotation';
    throw new Error(`Failed to rotate API keys: ${errorMessage}`);
  } finally {
    // Always release the mutex
    await releaseMutex(db, lockKey);
  }
}

/**
 * Initializes API key management by creating the first key if none exists.
 * Returns the plain text key if a new one was created, otherwise null.
 */
export async function initializeApiKeys(
  userId: string,
): Promise<string | null> {
  if (!(await isValidUserId(userId))) {
    throw new Error('Invalid userId format or user not found');
  }

  if (!(await isWithinRateLimit(`init:${userId}`))) {
    // Specific rate limit key
    throw new Error('Rate limit exceeded for API key initialization');
  }

  try {
    const { db } = await connectToDatabase();
    const existingKey = await db
      .collection<ApiKeyRecord>(API_KEY_COLLECTION)
      .findOne({ userId: userId, isActive: true }); // Check for active keys

    if (!existingKey) {
      logger.info(`No active key found for user ${userId}. Initializing...`);
      // Rotate keys will generate and store the first key
      const { plainKey } = await rotateApiKeys(userId);
      logger.info(`API key initialized successfully for user ${userId}.`);
      return plainKey; // Return the newly generated plain key
    } else {
      logger.info(
        `User ${userId} already has an active API key. No initialization needed.`,
      );
      return null; // Indicate no new key was generated
    }
  } catch (error: unknown) {
    logger.error('Error initializing API keys', { userId, error });
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Unknown error during initialization';
    // Re-throw as the caller might need to handle initialization failure
    throw new Error(`Failed to initialize API keys: ${errorMessage}`);
  }
}

/**
 * Gets the active API key record for a user (returns the stored record with hashed key).
 */
export async function getApiKeyRecord(
  userId: string,
): Promise<ApiKeyRecord | undefined> {
  if (!(await isValidUserId(userId))) {
    logger.warn(`Invalid userId format or user not found: ${userId}`);
    return undefined;
  }

  if (!(await isWithinRateLimit(`get:${userId}`))) {
    // Specific rate limit key
    logger.warn(
      `Rate limit exceeded for getApiKeyRecord call by user: ${userId}`,
    );
    return undefined;
  }

  try {
    const { db } = await connectToDatabase();
    const apiKeyRecord = await db
      .collection<ApiKeyRecord>(API_KEY_COLLECTION)
      .findOne(
        {
          userId: userId,
          isActive: true,
          expiresAt: { $gt: new Date() },
        },
        // { hint: 'userId_1_isActive_1_expiresAt_1' } // Optional hint
      );
    // findOne returns T | null. Convert null to undefined.
    return apiKeyRecord ?? undefined;
  } catch (error: unknown) {
    logger.error('Error getting API key record', { userId, error });
    return undefined; // Return undefined on error
  }
}

/**
 * Deletes all API keys (active and inactive) for a user. Use with caution.
 */
export async function deleteAllApiKeysForUser(userId: string): Promise<void> {
  if (!(await isValidUserId(userId))) {
    throw new Error('Invalid userId format or user not found');
  }

  if (!(await isWithinRateLimit(`delete:${userId}`))) {
    // Specific rate limit key
    throw new Error('Rate limit exceeded for API key deletion');
  }

  try {
    const { db } = await connectToDatabase();
    const result = await db
      .collection<ApiKeyRecord>(API_KEY_COLLECTION)
      .deleteMany({ userId: userId });
    logger.info(`Deleted ${result.deletedCount} API keys for user ${userId}`);
  } catch (error: unknown) {
    logger.error('Error deleting API keys', { userId, error });
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Unknown error during key deletion';
    throw new Error(`Failed to delete API keys: ${errorMessage}`);
  }
}

// --- Helper Functions ---

// Basic format check (UUID v4) - doesn't hit the DB
function isValidUserIdFormat(userId: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return typeof userId === 'string' && uuidRegex.test(userId);
}

// Checks format AND existence in the database
async function isValidUserId(userId: string): Promise<boolean> {
  if (!isValidUserIdFormat(userId)) {
    logger.warn(`Invalid userId format: ${userId}`);
    return false;
  }

  // Check if user exists in the database (assuming a 'users' collection)
  try {
    const { db } = await connectToDatabase();
    // Use the UserDocument interface to inform TypeScript about the _id type.
    // Ensure the field name ('_id' here) matches your users collection schema.
    const user = await db
      .collection<UserDocument>('users')
      .findOne({ _id: userId });
    if (!user) {
      logger.warn(`User not found in database: ${userId}`);
      return false;
    }
    return true; // User exists
  } catch (error: unknown) {
    logger.error('Error validating userId against database', { userId, error });
    return false; // Treat database errors as validation failure
  }
}

// Rate limiting logic using Redis
async function isWithinRateLimit(keySuffix: string): Promise<boolean> {
  const key = `rateLimit:${keySuffix}`; // e.g., rateLimit:rotate:user123
  try {
    // Use pipeline for atomic operations
    const pipeline = redis.pipeline();
    pipeline.incr(key);
    pipeline.ttl(key);
    const results = await pipeline.exec();

    // Check for errors in pipeline execution
    if (!results || results.some((result) => result[0] !== null)) {
      logger.error('Redis pipeline error during rate limiting', {
        key,
        results,
      });
      return false; // Fail closed on Redis error
    }

    const [[, currentCount], [, ttl]] = results;

    if (typeof currentCount !== 'number') {
      logger.error('Invalid count received from Redis INCR', {
        key,
        currentCount,
      });
      return false; // Fail closed
    }

    // If TTL is -1 (no expiry set yet), set the expiry
    // If TTL is -2 (key doesn't exist - though INCR should create it), also set expiry
    if (ttl === -1 || ttl === -2) {
      await redis.expire(key, RATE_LIMIT_WINDOW / 1000);
    }

    if (currentCount > MAX_REQUESTS_PER_WINDOW) {
      logger.warn('Rate limit exceeded', { key, currentCount });
      return false;
    }

    return true;
  } catch (error) {
    logger.error('RateLimitCheck Redis Error', { key, error });
    return false; // Fail closed on Redis connection errors etc.
  }
}

// Simple MongoDB-based mutex implementation using atomic operations
// Requires an index on { key: 1 } and an expireAfterSeconds index on 'expireAt'
// in the 'mutexes' collection for performance and automatic cleanup.
async function acquireMutex(db: Db, key: string): Promise<boolean> {
  const now = new Date();
  const mutexTimeout = 30 * 1000; // Mutex timeout: 30 seconds

  try {
    // Attempt to insert a lock document. If the key already exists (unique index), it fails.
    await db.collection('mutexes').insertOne({
      key, // The lock identifier (must be unique)
      createdAt: now,
      // TTL index on 'expireAt' will automatically remove the lock document
      expireAt: new Date(now.getTime() + mutexTimeout),
    });
    // logger.debug(`Mutex ${key} acquired.`); // Optional debug log
    return true; // Insertion succeeded, lock acquired
  } catch (error: unknown) {
    // Check if the error is a duplicate key error (code 11000)
    if (error instanceof Error && 'code' in error && error.code === 11000) {
      // logger.debug(`Mutex ${key} already held.`); // Optional debug log
      return false; // Mutex already held by another process
    }
    // Log other unexpected errors
    logger.error(`Error acquiring mutex ${key}`, { error });
    return false; // Failed to acquire mutex due to an unexpected error
  }
}

async function releaseMutex(db: Db, key: string): Promise<void> {
  try {
    await db.collection('mutexes').deleteOne({ key });
    // Optional: Log based on whether the mutex was found and deleted.
    // if (result.deletedCount === 1) {
    //   logger.debug(`Mutex ${key} released.`);
    // } else {
    //   logger.debug(`Mutex ${key} not found or already released/expired.`);
    // }
  } catch (error: unknown) {
    logger.error(`Error releasing mutex ${key}`, { error });
    // Decide if this error should be propagated or just logged
  }
}
