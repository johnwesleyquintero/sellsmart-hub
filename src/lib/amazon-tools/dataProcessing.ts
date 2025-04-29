interface AmazonDataItem {
  [key: string]: any;
}

export function processAmazonData(data: AmazonDataItem[]) {
  if (!data) throw new Error('Invalid data');
  if (data.length === 0) return [];

  return data.map((item) => ({
    ...item,
    processed: true,
  }));
}
