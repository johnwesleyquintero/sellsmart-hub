import { Db, MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to .env.local');
}

if (!process.env.MONGODB_DB) {
  throw new Error('Please add your MongoDB Database name to .env.local');
}

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;
const apiKeyCollectionName = 'apiKeys';

export async function connectToDatabase() {
  if (!MONGODB_URI || !MONGODB_DB) {
    throw new Error('Please define MONGODB_URI/MONGODB_DB in .env.local');
  }

  if (cachedClient && cachedDb) {
    try {
      // Check if the connection is still valid by pinging the database
      await cachedDb.command({ ping: 1 });
      return { client: cachedClient, db: cachedDb };
    } catch (error) {
      console.warn('Stale MongoDB connection detected. Reconnecting...');
      // Close the existing client
      await cachedClient.close();
      cachedClient = null;
      cachedDb = null;
      throw error; // Re-throw the error to trigger reconnection
    }
  }

  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(MONGODB_DB);

    cachedClient = client;
    cachedDb = db;

    // Create index for API keys
    try {
      await db.collection(apiKeyCollectionName).createIndex({ key: 1 });
      console.log('API key index created successfully.');
    } catch (error) {
      console.error('Error creating API key index:', error);
    }

    return { client, db };
  } catch (error: unknown) {
    console.error('MongoDB connection error:', error);
    throw new Error(
      `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

export const clientPromise = async () => {
  const { client } = await connectToDatabase();
  return client;
};
