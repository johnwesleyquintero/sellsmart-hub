import { Db, MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to .env.local');
}

if (!process.env.MONGODB_DB) {
  throw new Error('Please add your MongoDB Database name to .env.local');
}

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;

export async function connectToDatabase() {
  if (!MONGODB_URI || !MONGODB_DB) {
    throw new Error('Please define MONGODB_URI/MONGODB_DB in .env.local');
  }

  if (typeof window !== 'undefined') {
    throw new Error('Database connections are only allowed server-side');
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

    return { client, db };
  } catch (error: any) {
    console.error('MongoDB connection error:', error);
    throw new Error(`Database connection failed: ${error.message}`);
  }
}

export const clientPromise = async () => {
  const { client } = await connectToDatabase();
  return client;
};
