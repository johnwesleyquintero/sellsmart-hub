import crypto from 'crypto';
import { NextResponse } from 'next/server';

type ApiKeyRecord = {
  key: string;
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
};

const API_KEYS: ApiKeyRecord[] = [];
const KEY_ROTATION_INTERVAL = 30 * 24 * 60 * 60 * 1000; // 30 days in ms
const KEY_EXPIRATION = 90 * 24 * 60 * 60 * 1000; // 90 days in ms

/**
 * Generates a new secure API key
 */
export function generateApiKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validates an API key against stored keys
 */
export function validateApiKey(key: string): boolean {
  const now = new Date();
  return API_KEYS.some(
    (record) => 
      record.key === key && 
      record.isActive && 
      record.expiresAt > now
  );
}

/**
 * Middleware for API key validation
 */
export function apiKeyMiddleware(request: Request) {
  const apiKey = request.headers.get('x-api-key') || '';
  
  if (!validateApiKey(apiKey)) {
    return NextResponse.json(
      { error: 'Invalid or expired API key' },
      { status: 401 }
    );
  }
  
  return null;
}

/**
 * Rotates API keys by generating new ones and deactivating old ones
 */
export function rotateApiKeys() {
  // Deactivate keys older than rotation interval
  const rotationThreshold = new Date(Date.now() - KEY_ROTATION_INTERVAL);
  API_KEYS.forEach((key) => {
    if (key.createdAt < rotationThreshold) {
      key.isActive = false;
    }
  });
  
  // Generate new key
  const newKey = {
    key: generateApiKey(),
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + KEY_EXPIRATION),
    isActive: true
  };
  
  API_KEYS.push(newKey);
  return newKey;
}

/**
 * Initializes API key management with first key
 */
export function initializeApiKeys() {
  if (API_KEYS.length === 0) {
    rotateApiKeys();
  }
}