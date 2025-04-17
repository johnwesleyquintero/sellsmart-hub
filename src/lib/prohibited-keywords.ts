import {
  ProhibitedKeyword,
  ProhibitedKeywordCollection,
} from './models/prohibited-keywords';
import { connectToDatabase } from './mongodb';

export async function getAll(): Promise<string[]> {
  try {
    const { db } = await connectToDatabase();
    const keywords = await db
      .collection<ProhibitedKeyword>(ProhibitedKeywordCollection)
      .find({}, { projection: { keyword: 1 } })
      .toArray();
    return keywords.map((k) => k.keyword);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Failed to fetch prohibited keywords:', error.message);
    } else {
      console.error('Failed to fetch prohibited keywords:', String(error));
    }
    return [];
  }
}

export async function add(keyword: string): Promise<void> {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection(ProhibitedKeywordCollection);
    const exists = await collection.findOne({ keyword });

    if (!exists) {
      const newKeyword: ProhibitedKeyword = {
        keyword,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await collection.insertOne(newKeyword);
    }
  } catch (error) {
    console.error('Failed to add prohibited keyword:', error);
    throw error;
  }
}

export const ProhibitedKeywords = {
  getAll,
  add,
  getKeywords: getAll,
};
