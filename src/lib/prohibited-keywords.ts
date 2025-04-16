const DB_PATH = '/data/prohibited-keywords/db.json';

interface ProhibitedKeywordsDB {
  keywords: string[];
  lastUpdated: string;
}

export async function getAll(): Promise<string[]> {
  try {
    const response = await fetch(DB_PATH);
    const data = (await response.json()) as ProhibitedKeywordsDB;
    return data.keywords;
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
    const keywords = await getAll();
    if (!keywords.includes(keyword)) {
      const updatedData: ProhibitedKeywordsDB = {
        keywords: [...keywords, keyword],
        lastUpdated: new Date().toISOString(),
      };
      await fetch('/api/prohibited-keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });
    }
  } catch (error) {
    console.error('Failed to add prohibited keyword:', error);
    throw error;
  }
}

export const ProhibitedKeywords = {
  getAll,
  add,
  getKeywords: getAll
};
