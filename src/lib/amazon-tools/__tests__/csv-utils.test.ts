type RequiredColumns =
  | 'price'
  | 'reviews'
  | 'rating'
  | 'conversion_rate'
  | 'click_through_rate'
  | 'asin';

import {
  processAmazonCsv,
  safeParseNumber,
  validateAsinFormat,
  validateRequiredColumns,
} from '@/lib/amazon-tools/csv-utils';

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
      type RequiredColumns =
        | 'price'
        | 'reviews'
        | 'rating'
        | 'conversion_rate'
        | 'click_through_rate'
        | 'asin';

      const required: RequiredColumns[] = ['asin', 'price', 'reviews'];
      expect(validateRequiredColumns(testData, required)).toEqual([]);
    });

    it('should return missing columns when some are absent', () => {
      const missingReviewsData = [{ asin: 'B0TEST1234', price: '29.99' }];
      const required = ['asin', 'price'] as const;
      const requiredWithReviews = [...required, 'reviews'] as const;
      expect(
        validateRequiredColumns(missingReviewsData, requiredWithReviews as any),
      ).toEqual(['reviews']);
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
    it('should process valid CSV data', () => {
      const requiredColumns: (
        | 'price'
        | 'reviews'
        | 'rating'
        | 'conversion_rate'
        | 'click_through_rate'
        | 'asin'
      )[] = [
        'asin',
        'price',
        'reviews',
        'rating',
        'conversion_rate',
        'click_through_rate',
      ];
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
      expect(() =>
        processAmazonCsv(testData, ['missing'] as unknown as RequiredColumns[]),
      ).toThrow('Missing required columns: missing');
    });
  });
});
