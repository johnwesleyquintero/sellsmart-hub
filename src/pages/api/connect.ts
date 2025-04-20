import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../lib/mongodb';
import { createUniqueIndex } from '../../lib/mongodb/create-unique-index';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    await connectToDatabase();
    await createUniqueIndex(); // Call the createUniqueIndex function
    // Connection established successfully
    res.status(200).json({ message: 'Connected to database' });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
