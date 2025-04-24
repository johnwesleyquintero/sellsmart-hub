import {
  ProhibitedKeyword,
  ProhibitedKeywordCollection,
} from './models/prohibited-keywords';
import { connectToDatabase } from './mongodb'; // Import connectToDatabase

export async function getAll(): Promise<string[]> {
  console.log('getAll called');
  try {
    const { db } = await connectToDatabase();
    const keywords = await db
      .collection<ProhibitedKeyword>(ProhibitedKeywordCollection)
      // Explicitly project only the keyword field and _id (which is returned by default unless excluded)
      .find({}, { projection: { keyword: 1, _id: 0 } })
      .toArray();
    // Type the parameter 'k' explicitly. Since we projected only 'keyword',
    // the type is { keyword: string }
    return keywords.map((k: { keyword: string }) => k.keyword);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Failed to fetch prohibited keywords:', error.message);
    } else {
      console.error('Failed to fetch prohibited keywords:', String(error));
    }
    // Return an empty array in case of error to maintain the function signature
    return [];
  }
}

export async function add(keyword: string): Promise<void> {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection<ProhibitedKeyword>(
      ProhibitedKeywordCollection,
    );
    // Ensure case-insensitive check if needed, otherwise keep as is
    const lowerCaseKeyword = keyword.toLowerCase();
    const exists = await collection.findOne({
      keyword: { $regex: new RegExp(`^${lowerCaseKeyword}$`, 'i') },
    });

    if (!exists) {
      // Store the original casing or lowercase based on requirements
      const newKeyword: Omit<ProhibitedKeyword, '_id'> = {
        keyword: keyword, // Store original casing
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await collection.insertOne(newKeyword);
      console.log(`Added prohibited keyword: ${keyword}`);
    } else {
      console.log(`Prohibited keyword already exists: ${keyword}`);
    }
  } catch (error) {
    console.error('Failed to add prohibited keyword:', error);
    // Re-throw the error to allow higher-level error handling if necessary
    throw error;
  }
}

// Consider renaming this export for clarity if 'getAll' is the primary function used elsewhere
export const ProhibitedKeywords = {
  getAll,
  add,
  // Optional: Keep getKeywords if it's used elsewhere, but it's redundant with getAll
  // getKeywords: getAll,
};
