import {
  processAmazonCsv,
  safeParseNumber,
  validateAsinFormat,
  validateRequiredColumns,
} from '../csv-utils';

describe('CSV Validation Utilities', () => {
  const testData = [
    {
      asin: 'B0TEST1234',
      price: '29.99',
      reviews: '150',
      rating: '4.5',
      conversion_rate: '2.3',
      click_through_rate: '0.45',
    },
  ];

  describe('validateRequiredColumns', () => {
    it('should return empty array when all required columns exist', () => {
      const required = ['asin', 'price', 'reviews'];
      expect(validateRequiredColumns(testData, required)).toEqual([]);
    });

    it('should return missing columns when some are absent', () => {
      const required = ['asin', 'missing'];
      expect(validateRequiredColumns(testData, required)).toEqual(['missing']);
    });
  });

  describe('validateAsinFormat', () => {
    it('should validate correct ASIN format', () => {
      expect(validateAsinFormat('B0ABCD1234')).toBe(true);
    });

    it('should reject invalid ASIN formats', () => {
      expect(validateAsinFormat('123')).toBe(false);
      expect(validateAsinFormat('B0abcd1234')).toBe(false);
      expect(validateAsinFormat(' B0TEST1234 ')).toBe(true);
      expect(validateAsinFormat('B0123456789')).toBe(false);
    });
  });

  describe('safeParseNumber', () => {
    it('should parse valid numbers', () => {
      expect(safeParseNumber('123', 'test')).toBe(123);
      expect(safeParseNumber('45.67', 'test')).toBe(45.67);
    });

    it('should throw on invalid numbers', () => {
      expect(() => safeParseNumber('abc', 'price')).toThrow(
        'Invalid price value: abc',
      );
      expect(() => safeParseNumber('123.45.67', 'rating')).toThrow(
        'Invalid rating value: 123.45.67',
      );
      expect(() => safeParseNumber('', 'reviews')).toThrow(
        'Invalid reviews value: ',
      );
    });

    it('should handle whitespace and scientific notation', () => {
      expect(safeParseNumber(' 42 ', 'test')).toBe(42);
      expect(safeParseNumber('1e3', 'test')).toBe(1000);
    });
  });

  describe('processAmazonCsv', () => {
    const requiredColumns = ['asin', 'price', 'reviews'];

    it('should process valid CSV data', () => {
      const result = processAmazonCsv(testData, requiredColumns);
      expect(result[0]).toEqual({
        asin: 'B0TEST1234',
        price: 29.99,
        reviews: 150,
        rating: 4.5,
        conversion_rate: 2.3,
        click_through_rate: 0.45,
      });
    });

    it('should throw on missing columns', () => {
      expect(() => processAmazonCsv(testData, ['missing'])).toThrow(
        'Missing required columns: missing',
      );
    });
  });
});
