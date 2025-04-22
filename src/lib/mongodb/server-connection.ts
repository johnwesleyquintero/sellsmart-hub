'use server';

import { MongoClient } from 'mongodb';

export async function connectToDatabase() {
  if (!process.env.MONGODB_URI || !process.env.MONGODB_DB) {
    throw new Error('MongoDB configuration missing');
  }

  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    return {
      client,
      db: client.db(process.env.MONGODB_DB),
    };
  } catch (error) {
    console.error('MongoDB connection error:', error);
    await client.close();
    throw new Error('Database connection failed');
  }
}
