export const validateCsvContent = (
  content: unknown[],
): { validRows: Record<string, unknown>[]; errors: string[] } => {
  const errors: string[] = [];
  const validRows = content.filter((row, index) => {
    if (!row || typeof row !== 'object') {
      errors.push(`Row ${index + 1}: Invalid row format`);
      return false;
    }
    return true;
  }) as Record<string, unknown>[];
  return { validRows, errors };
};
