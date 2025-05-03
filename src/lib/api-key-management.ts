import { connectToDatabase } from '@/lib/mongodb';
import { randomBytes } from 'crypto';

const apiKeyCollectionName = 'apiKeys';

// Function to generate a new API key
export async function generateApiKey(userId: string): Promise<string> {
  const apiKey = randomBytes(32).toString('hex'); // Generate a 64-character hex string
  const { db } = await connectToDatabase();
  await db.collection(apiKeyCollectionName).insertOne({
    userId,
    key: apiKey,
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
  const apiKeyDocument = await db
    .collection(apiKeyCollectionName)
    .findOneAndUpdate(
      {
        key: apiKey,
        revoked: false,
      },
      {
        $set: {
          lastUsedAt: new Date(),
        },
      },
      {
        returnDocument: 'after',
      },
    );
  return !!apiKeyDocument;
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
