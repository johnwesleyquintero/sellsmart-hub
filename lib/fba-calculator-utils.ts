export type ProductData = {
  product: string;
  cost: number;
  price: number;
  fees: number;
  profit?: number;
  roi?: number;
  margin?: number;
};

export function calculateProfit(data: ProductData[]): ProductData[] {
  const calculatedResults = data.map((item) => {
    const profit = item.price - item.cost - item.fees;
    const roi = (profit / item.cost) * 100;
    const margin = (profit / item.price) * 100;
    return { ...item, profit, roi, margin };
  });
  return calculatedResults;
}
