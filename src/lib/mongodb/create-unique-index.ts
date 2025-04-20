import { connectToDatabase } from '../mongodb'; // Adjust the path as necessary

export async function createUniqueIndex() {
  try {
    const { db } = await connectToDatabase();
    await db.collection('prohibited-keywords').createIndex(
      { keyword: 1 },
      { unique: true }
    );
    console.log('Unique index created on keyword field');
  } catch (error) {
    console.error('Error creating unique index:', error);
  }
}