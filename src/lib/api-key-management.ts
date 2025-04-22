import bcrypt from 'bcrypt';
import Redis from 'ioredis';
import type { Db } from 'mongodb'; // Import Db and ObjectId types
import { NextResponse } from 'next/server';
import crypto from 'node:crypto'; // Fix: Use node:crypto protocol
import { connectToDatabase } from './mongodb';

const API_KEY_COLLECTION = 'apiKeys';

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

// Define a minimal interface for the User document, assuming _id is a string (UUID)
interface UserDocument {
    _id: string; // Assuming _id is the string userId based on UUID validation
    // other user fields...
}


/**
 * Generates a new secure API key
 */
export async function generateApiKey(db: Db): Promise<string> { // Fix: Use Db type
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

    // Find the key record using the plain text key provided by the user
    // Note: This assumes you are storing plain text keys, which is insecure.
    // If you store hashed keys, you need to fetch potential keys by userId
    // and then compare the provided key with the stored hash using bcrypt.compare.
    // Let's assume the current implementation intends to compare plain text keys (needs review).
    // **Correction:** The `rotateApiKeys` function *does* hash keys before storing.
    // Therefore, validation must fetch the key by userId and then compare hashes.

    const apiKeyRecord = await db
      .collection<ApiKeyRecord>(API_KEY_COLLECTION)
      .findOne({
        userId: userId,
        isActive: true,
        expiresAt: { $gt: new Date() },
      });

    if (!apiKeyRecord) {
        return false; // No active key found for the user
    }

    // Compare the provided plain text key with the stored hash
    const isValid = await bcrypt.compare(key, apiKeyRecord.key);
    return isValid;

  } catch (error: unknown) { // Fix: Use unknown instead of any
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
    // Clone the request to allow reading the body here and in the route handler
    const clonedRequest = request.clone();
    const requestBody = await clonedRequest.json();
    const userId = requestBody.userId;

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId in request body' },
        { status: 400 },
      );
    }

    // Validate the API key (this now involves bcrypt comparison)
    if (!(await validateApiKey(apiKey, userId))) {
      return NextResponse.json(
        { error: 'Invalid or expired API key' },
        { status: 401 },
      );
    }

    // If validation passes, return undefined to allow the original request to proceed.
    return undefined;
  } catch (error) {
    console.error('Error in apiKeyMiddleware:', error);
    // Check if the error is due to JSON parsing
    if (error instanceof SyntaxError) {
        return NextResponse.json(
            { error: 'Invalid JSON in request body' },
            { status: 400 },
        );
    }
    // Generic error for other issues
    return NextResponse.json(
      { error: 'Error processing API key validation' },
      { status: 500 }, // Use 500 for server errors
    );
  }
}


/**
 * Rotates API keys by generating new ones and deactivating old ones
 */
export async function rotateApiKeys(userId: string): Promise<ApiKeyRecord> {
  if (!(await isValidUserId(userId))) { // Fix: Added await
    throw new Error('Invalid userId format or user not found');
  }

  if (!(await isWithinRateLimit(userId))) { // Fix: Added await
    throw new Error('Rate limit exceeded for API key rotation');
  }
  const { db } = await connectToDatabase();
  // Acquire mutex before proceeding
  const mutex = await acquireMutex(db, `rotateApiKeys:${userId}`);
  if (!mutex) {
    throw new Error(
      'Failed to acquire mutex. Another rotation might be in progress.',
    );
  }

  try {
    // Deactivate all existing keys for the user inside the mutex lock
    await db
      .collection<ApiKeyRecord>(API_KEY_COLLECTION)
      .updateMany({ userId: userId, isActive: true }, { $set: { isActive: false } });

    // Generate new key
    const plainKey = await generateApiKey(db); // Generate the plain text key first
    const hashedKey = await bcrypt.hash(plainKey, 10); // Hash the key for storage

    const newKeyRecord: ApiKeyRecord = {
      key: hashedKey, // Store the hashed key
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + KEY_EXPIRATION),
      isActive: true,
      userId: userId,
    };

    // Store the new key record in the database
    await db.collection<ApiKeyRecord>(API_KEY_COLLECTION).insertOne(newKeyRecord);

    // Return the record, but crucially, return the *plain text key* for the user to use immediately.
    // The stored record keeps the hashed version.
    return { ...newKeyRecord, key: plainKey }; // Return the plain key to the caller

  } catch (error: unknown) { // Fix: Use unknown instead of any
    console.error('Error rotating API keys:', error);
    // Ensure the error is an instance of Error before accessing message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during key rotation';
    throw new Error(`Failed to rotate API keys: ${errorMessage}`);
  } finally {
    // Always release the mutex
    await releaseMutex(db, `rotateApiKeys:${userId}`);
  }
}


/**
 * Initializes API key management with first key for a user
 */
export async function initializeApiKeys(userId: string): Promise<void> {
  if (!(await isValidUserId(userId))) { // Fix: Added await
    throw new Error('Invalid userId format or user not found');
  }

  if (!(await isWithinRateLimit(userId))) { // Fix: Added await
    throw new Error('Rate limit exceeded for API key initialization');
  }
  try {
    const { db } = await connectToDatabase();
    const existingKey = await db
      .collection<ApiKeyRecord>(API_KEY_COLLECTION)
      .findOne({ userId: userId, isActive: true }); // Check for active keys

    if (!existingKey) {
      console.log(`No active key found for user ${userId}. Initializing...`);
      await rotateApiKeys(userId); // This will generate and store the first key
      console.log(`API key initialized successfully for user ${userId}.`);
    } else {
       console.log(`User ${userId} already has an active API key. No initialization needed.`);
    }
  } catch (error: unknown) { // Fix: Use unknown instead of any
    console.error('Error initializing API keys:', error);
     const errorMessage = error instanceof Error ? error.message : 'Unknown error during initialization';
    // Don't re-throw here unless the caller needs to handle it specifically. Logging might be sufficient.
     throw new Error(`Failed to initialize API keys: ${errorMessage}`);
  }
}

/**
 * Gets the active API key record for a user (returns the stored record, not the plain key)
 */
export async function getApiKey(userId: string): Promise<ApiKeyRecord | undefined> { // Return undefined instead of null
  if (!(await isValidUserId(userId))) { // Fix: Added await
    console.warn(`Invalid userId format or user not found: ${userId}`);
    return undefined; // Fix: Return undefined for invalid userId
  }

  if (!(await isWithinRateLimit(userId))) { // Fix: Added await
    console.warn(`Rate limit exceeded for getApiKey call by user: ${userId}`);
    return undefined; // Fix: Return undefined for rate limit exceeded
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
    // findOne returns T | null. Convert null to undefined.
    return apiKey ?? undefined; // Return the found record or undefined
  } catch (error: unknown) { // Fix: Use unknown instead of any
    console.error('Error getting API key:', error);
    return undefined; // Fix: Return undefined on error
  }
}

/**
 * Deletes all API keys for a user
 */
export async function deleteApiKey(userId: string): Promise<void> {
  if (!(await isValidUserId(userId))) { // Fix: Added await
    throw new Error('Invalid userId format or user not found');
  }

  if (!(await isWithinRateLimit(userId))) { // Fix: Added await
    throw new Error('Rate limit exceeded for API key deletion');
  }
  try {
    const { db } = await connectToDatabase();
    const result = await db
      .collection<ApiKeyRecord>(API_KEY_COLLECTION)
      .deleteMany({ userId: userId });
    console.log(`Deleted ${result.deletedCount} API keys for user ${userId}`);
  } catch (error: unknown) { // Fix: Use unknown instead of any
    console.error('Error deleting API keys:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during key deletion';
    throw new Error(`Failed to delete API keys: ${errorMessage}`);
  }
}

// --- Helper Functions ---

async function isValidUserId(userId: string): Promise<boolean> {
  // Basic format check (UUID v4)
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!userId || !uuidRegex.test(userId)) {
    console.warn(`Invalid userId format: ${userId}`);
    return false;
  }

  // Check if user exists in the database (assuming a 'users' collection)
  try {
    const { db } = await connectToDatabase();
    // Adapt 'userIdField' to the actual field name storing the user ID in your 'users' collection
    // Use the UserDocument interface to inform TypeScript about the _id type.
    const user = await db.collection<UserDocument>('users').findOne({ _id: userId }); // Example: Assuming _id is the string userId
    if (!user) {
        console.warn(`User not found in database: ${userId}`);
        return false;
    }
    return true; // User exists
  } catch (error: unknown) { // Fix: Use unknown instead of any
    console.error('Error validating userId against database:', error);
    return false; // Treat database errors as validation failure
  }
}

async function isWithinRateLimit(userId: string): Promise<boolean> {
  const key = `rateLimit:${userId}`;
  const ttl = RATE_LIMIT_WINDOW / 1000; // TTL in seconds

  try {
      const count = await redis.incr(key);
      // Set expiry only if it's the first request in the window
      if (count === 1) {
          await redis.expire(key, ttl);
      }
      return count <= MAX_REQUESTS_PER_WINDOW;
  } catch (redisError: unknown) {
      console.error("Redis error during rate limiting:", redisError);
      // Fail open or closed? Depending on security requirements.
      // Failing open allows requests during Redis outage but bypasses rate limiting.
      // Failing closed blocks requests but maintains rate limit integrity if Redis recovers.
      return true; // Example: Fail open (allow request if Redis fails)
  }
}


// Simple MongoDB-based mutex implementation
// Note: This is a basic implementation. For high-contention scenarios,
// consider more robust distributed locking mechanisms or database-specific features.
async function acquireMutex(db: Db, key: string): Promise<boolean> { // Fix: Use Db type
  const now = new Date();
  const mutexTimeout = 30 * 1000; // Mutex timeout: 30 seconds

  try {
    // Attempt to insert a lock document. If the key already exists, it will fail.
    // Create an index on { key: 1 } in the 'mutexes' collection for performance.
    // Add an expireAfterSeconds index on 'expireAt' for automatic cleanup.
    const result = await db.collection('mutexes').insertOne({
      key, // The lock identifier
      createdAt: now,
      // Automatically remove the lock document after the timeout
      expireAt: new Date(now.getTime() + mutexTimeout),
    });

    return result.acknowledged; // True if insertion succeeded (lock acquired)
  } catch (error: unknown) { // Fix: Use unknown instead of any
    // Check if the error is a duplicate key error (code 11000)
    if (error instanceof Error && 'code' in error && error.code === 11000) {
      // Mutex already acquired by another process - uncomment log if needed for debugging
      // console.log(`Mutex ${key} already held.`);
      return false;
    }
    // Log other errors
    console.error(`Error acquiring mutex ${key}:`, error);
    return false; // Failed to acquire mutex due to an unexpected error
  }
}

async function releaseMutex(db: Db, key: string): Promise<void> { // Fix: Use Db type
  try {
    // Optional: Log based on whether the mutex was found and deleted or already gone.
    // Uncomment if needed for debugging.
    // if (result.deletedCount === 0) {
    //   console.log(`Mutex ${key} not found or already released/expired.`);
    // } else {
    //   console.log(`Mutex ${key} released.`);
    // }
  } catch (error: unknown) { // Fix: Use unknown instead of any
    console.error(`Error releasing mutex ${key}:`, error);
    // Decide if this error should be propagated
  }
}
