export function calculateOptimalPrice(productData: ProductPricingData, competitorPrices: number[]): number {
  const averageCompetitorPrice = competitorPrices.reduce((a, b) => a + b, 0) / competitorPrices.length;
  return Math.max(
    productData.cost * 1.2,
    averageCompetitorPrice * 0.95
  );
}
