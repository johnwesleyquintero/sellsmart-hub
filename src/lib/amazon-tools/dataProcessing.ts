interface AmazonData {
  [key: string]: unknown;
}

export function processAmazonData(data: AmazonData[]) {
  if (!data) throw new Error('Invalid data');
  if (data.length === 0) return [];

  return data.map((item) => ({
    ...item,
    processed: true,
  }));
}
