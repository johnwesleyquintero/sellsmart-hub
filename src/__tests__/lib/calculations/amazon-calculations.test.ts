import { AmazonAlgorithms } from '@/lib/amazon-tools/amazon-algorithms';

describe('Amazon Calculations', () => {
  describe('calculateOptimalPrice', () => {
    it('calculates optimal price based on competitor data', () => {
      const result = AmazonAlgorithms.calculateOptimalPrice({
        competitorPrices: [10],
        productScore: 0.7,
        currentPrice: 11,
      });
      expect(result).toBeGreaterThan(0);
      expect(typeof result).toBe('number');
    });

    it('handles empty competitor data', () => {
      const result = AmazonAlgorithms.calculateOptimalPrice({
        competitorPrices: [],
        productScore: 0,
        currentPrice: 10,
      });
      expect(result).toBe(0);
    });
  });

  describe('calculateACoS', () => {
    it('calculates ACoS correctly', () => {
      const adSpend = 100;
      const sales = 1000;

      const acos = AmazonAlgorithms.calculateACoS(adSpend, sales);
      expect(acos).toBe(10); // 10% ACoS
    });

    it('handles zero sales', () => {
      const adSpend = 100;
      const sales = 0;

      expect(() => AmazonAlgorithms.calculateACoS(adSpend, sales)).toThrow();
    });

    it('handles negative values', () => {
      const adSpend = -100;
      const sales = 1000;

      expect(() => AmazonAlgorithms.calculateACoS(adSpend, sales)).toThrow();
    });
  });

  describe('calculateProductScore', () => {
    it('calculates product score based on multiple factors', () => {
      const productData = {
        reviews: 100,
        rating: 4.5,
        salesRank: 1000,
        price: 19.99,
        category: 'Electronics',
      };

      const score = AmazonAlgorithms.calculateProductScore(productData);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('handles missing data points', () => {
      const productData = {
        reviews: undefined,
        rating: 4.5,
        salesRank: 1000,
        price: 19.99,
        category: 'Electronics',
      };

      const score = AmazonAlgorithms.calculateProductScore(productData);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('penalizes poor performance metrics', () => {
      const poorProductData = {
        reviews: 5,
        rating: 2.0,
        salesRank: 100000,
        price: 49.99,
        category: 'Electronics',
      };

      const goodProductData = {
        reviews: 1000,
        rating: 4.8,
        salesRank: 100,
        price: 29.99,
        category: 'Electronics',
      };

      const poorScore = AmazonAlgorithms.calculateProductScore(poorProductData);
      const goodScore = AmazonAlgorithms.calculateProductScore(goodProductData);

      expect(poorScore).toBeLessThan(goodScore);
    });
  });
});
