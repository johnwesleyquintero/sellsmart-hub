import { connectToDatabase } from '@/lib/mongodb';
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from 'crypto';

const apiKeyCollectionName = 'apiKeys';

// Function to generate a salt
export function generateSalt(): string {
  return randomBytes(16).toString('hex');
}
// Function to generate a new API key
export async function generateApiKey(userId: string): Promise<string> {
  const apiKey = randomBytes(32).toString('hex');
  let salt: string;
  let key: Buffer;
  let iv: Buffer;
  let encryptedApiKey: Buffer;

  salt = generateSalt();
  key = scryptSync(apiKey, salt, 32);
  iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-cbc', key, iv);
  encryptedApiKey = cipher.update(apiKey);
  encryptedApiKey = Buffer.concat([encryptedApiKey, cipher.final()]);

  const { db } = await connectToDatabase();
  await db.collection(apiKeyCollectionName).insertOne({
    userId,
    salt: salt,
    iv: iv.toString('hex'),
    encryptedKey: encryptedApiKey.toString('hex'),
    createdAt: new Date(),
    revoked: false,
    lastUsedAt: null,
  });
  return apiKey;
}

// Function to revoke an API key
export async function revokeApiKey(apiKey: string): Promise<void> {
  const { db } = await connectToDatabase();
  await db
    .collection(apiKeyCollectionName)
    .updateOne({ key: apiKey }, { $set: { revoked: true } });
}

// Function to validate an API key
export async function validateApiKey(apiKey: string): Promise<boolean> {
  const { db } = await connectToDatabase();
  const apiKeyDocument = await db.collection(apiKeyCollectionName).findOne({
    key: apiKey,
    revoked: false,
  });

  if (!apiKeyDocument) {
    return false;
  }

  const { salt, iv: ivString, encryptedKey } = apiKeyDocument;

  try {
    const key = scryptSync(apiKey, salt, 32);
    const iv = Buffer.from(ivString, 'hex');
    const decipher = createDecipheriv('aes-256-cbc', key, iv);
    let decryptedApiKey = decipher.update(Buffer.from(encryptedKey, 'hex'));
    decryptedApiKey = Buffer.concat([decryptedApiKey, decipher.final()]);

    if (decryptedApiKey.toString() !== apiKey) {
      return false;
    }
  } catch (error) {
    // Handle decryption errors
    console.error('Decryption error:', error);
    return false;
  }

  await db
    .collection(apiKeyCollectionName)
    .updateOne({ key: apiKey }, { $set: { lastUsedAt: new Date() } });

  return true;
}

// Function to get all valid API keys for a user
export async function getValidApiKeysForUser(
  userId: string,
): Promise<string[]> {
  const { db } = await connectToDatabase();
  const apiKeys = await db
    .collection(apiKeyCollectionName)
    .find({
      userId,
      revoked: false,
    })
    .toArray();
  return apiKeys.map((apiKey) => apiKey.key);
}
