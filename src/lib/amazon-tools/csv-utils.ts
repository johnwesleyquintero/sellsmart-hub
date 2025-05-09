export const validateRequiredColumns = <T extends Record<string, unknown>>(
  csvData: T[],
  requiredColumns: (keyof T)[],
): (keyof T)[] => {
  if (csvData.length === 0) return [];
  return requiredColumns.filter((col) => !(col in csvData[0]));
};

export const validateAsinFormat = (asin: string): boolean => {
  return /^[A-Z0-9]{10}$/.test(asin.trim());
};

export const safeParseNumber = (value: string, fieldName: string): number => {
  const trimmedValue = value.trim();
  if (
    !trimmedValue ||
    !/^[-+]?(\d+(\.\d*)?|\.\d+)([eE][-+]?\d+)?$/.test(trimmedValue)
  ) {
    throw new Error(`Invalid ${fieldName.replace('_', ' ')} value: ${value}`);
  }
  const num = parseFloat(trimmedValue);
  return num;
};

export const processAmazonCsv = <T extends Record<string, string | number>>(
  csvData: T[],
  requiredColumns: (keyof T)[],
) => {
  const missingColumns = validateRequiredColumns(csvData, requiredColumns);
  if (missingColumns.length > 0) {
    throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
  }

  return csvData.map((row) => ({
    asin: row.asin,
    price: safeParseNumber(String(row.price), 'price'),
    reviews: safeParseNumber(String(row.reviews), 'reviews'),
    rating: safeParseNumber(String(row.rating), 'rating'),
    conversion_rate: safeParseNumber(
      String(row.conversion_rate),
      'conversion_rate',
    ),
    click_through_rate: safeParseNumber(
      String(row.click_through_rate),
      'click_through_rate',
    ),
    niche: row.niche,
  }));
};
