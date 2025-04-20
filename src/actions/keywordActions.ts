'use server';

import {
  ProhibitedKeyword,
  ProhibitedKeywordCollection,
} from '@/lib/models/prohibited-keywords';
import { connectToDatabase } from '@/lib/mongodb';

export async function getAllProhibitedKeywords(): Promise<string[]> {
  try {
    const { db } = await connectToDatabase();
    const keywords = await db
      .collection<ProhibitedKeyword>(ProhibitedKeywordCollection)
      .find({}, { projection: { keyword: 1, _id: 0 } })
      .toArray();
    return keywords.map((k: { keyword: string }) => k.keyword);
  } catch (error: unknown) {
    console.error('Server Action Failed - getAllProhibitedKeywords:', error);
    return [];
  }
}

export async function addProhibitedKeyword(
  keyword: string,
): Promise<{ success: boolean; message: string }> {
  if (!keyword || typeof keyword !== 'string' || keyword.trim().length === 0) {
    return { success: false, message: 'Invalid keyword provided.' };
  }
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection<ProhibitedKeyword>(
      ProhibitedKeywordCollection,
    );
    const lowerCaseKeyword = keyword.trim().toLowerCase();
    const exists = await collection.findOne({
      keyword: { $regex: new RegExp(`^${lowerCaseKeyword}$`, 'i') },
    });

    if (!exists) {
      const newKeyword: Omit<ProhibitedKeyword, '_id'> = {
        keyword: keyword.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await collection.insertOne(newKeyword);
      console.log(`Server Action: Added prohibited keyword: ${keyword.trim()}`);
      return { success: true, message: `Keyword "${keyword.trim()}" added.` };
    } else {
      console.log(
        `Server Action: Prohibited keyword already exists: ${keyword.trim()}`,
      );
      return {
        success: false,
        message: `Keyword "${keyword.trim()}" already exists.`,
      };
    }
  } catch (error) {
    console.error('Server Action Failed - addProhibitedKeyword:', error);
    return {
      success: false,
      message: 'Failed to add keyword due to a server error.',
    };
  }
}
