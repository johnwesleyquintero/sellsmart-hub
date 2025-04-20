import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { connectToDatabase } from './mongodb';

const API_KEY_COLLECTION = 'apiKeys';
const KEY_ROTATION_INTERVAL = 30 * 24 * 60 * 60 * 1000; // 30 days in ms
const KEY_EXPIRATION = 90 * 24 * 60 * 60 * 1000; // 90 days in ms

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
export function generateApiKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validates an API key against stored keys in MongoDB
 */
export async function validateApiKey(key: string): Promise<boolean> {
  try {
    const { db } = await connectToDatabase();
    const apiKey = await db.collection<ApiKeyRecord>(API_KEY_COLLECTION).findOne({
      key,
      isActive: true,
      expiresAt: { $gt: new Date() },
    });
    return !!apiKey;
  } catch (error) {
    console.error('Error validating API key:', error);
    return false;
  }
}

/**
 * Middleware for API key validation
 */
export async function apiKeyMiddleware(request: Request) {
  const apiKey = request.headers.get('x-api-key') || '';

  if (!(await validateApiKey(apiKey))) {
    return NextResponse.json(
      { error: 'Invalid or expired API key' },
      { status: 401 },
    );
  }

  return null;
}

/**
 * Rotates API keys by generating new ones and deactivating old ones
 */
export async function rotateApiKeys(userId: string): Promise<ApiKeyRecord> {
  try {
    const { db } = await connectToDatabase();

    // Deactivate all existing keys for the user
    await db.collection<ApiKeyRecord>(API_KEY_COLLECTION).updateMany(
      { userId: userId },
      { $set: { isActive: false } },
    );

    // Generate new key
    const newKey: ApiKeyRecord = {
      key: generateApiKey(),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + KEY_EXPIRATION),
      isActive: true,
      userId: userId,
    };

    // Store the new key in the database
    await db.collection<ApiKeyRecord>(API_KEY_COLLECTION).insertOne(newKey);

    return newKey;
  } catch (error) {
    console.error('Error rotating API keys:', error);
    throw error;
  }
}

/**
 * Initializes API key management with first key for a user
 */
export async function initializeApiKeys(userId: string): Promise<void> {
  try {
    const { db } = await connectToDatabase();
    const existingKey = await db
      .collection<ApiKeyRecord>(API_KEY_COLLECTION)
      .findOne({ userId: userId });

    if (!existingKey) {
      await rotateApiKeys(userId);
    }
  } catch (error) {
    console.error('Error initializing API keys:', error);
    throw error;
  }
}

/**
 * Gets an API key for a user
 */
export async function getApiKey(userId: string): Promise<ApiKeyRecord | null> {
  try {
    const { db } = await connectToDatabase();
    const apiKey = await db.collection<ApiKeyRecord>(API_KEY_COLLECTION).findOne({
      userId: userId,
      isActive: true,
      expiresAt: { $gt: new Date() },
    });
    return apiKey || null;
  } catch (error) {
    console.error('Error getting API key:', error);
    return null;
  }
}

/**
 * Deletes all API keys for a user
 */
export async function deleteApiKey(userId: string): Promise<void> {
  try {
    const { db } = await connectToDatabase();
    await db.collection<ApiKeyRecord>(API_KEY_COLLECTION).deleteMany({ userId: userId });
  } catch (error) {
    console.error('Error deleting API keys:', error);
    throw error;
  }
}
