export const calculateMetrics = (adSpend, sales, impressions, clicks) => {
  const acos = (adSpend / sales) * 100;
  const roas = sales / adSpend;
  let ctr, conversionRate, cpc;
  if (impressions && clicks) {
    ctr = (clicks / impressions) * 100;
    conversionRate = (sales / clicks) * 100;
    cpc = adSpend / clicks;
  }
  return Object.assign(
    Object.assign(
      Object.assign({ acos, roas }, ctr && { ctr }),
      conversionRate && { conversionRate },
    ),
    cpc && { cpc },
  );
};
export const getAcosRating = (acos) => {
  if (acos < 15) return 'Excellent';
  if (acos < 25) return 'Good';
  if (acos < 35) return 'Fair';
  return 'Poor';
};
