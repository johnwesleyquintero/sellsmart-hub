interface AmazonData {
  asin: string;
  price: string;
  reviews: string;
  rating: string;
  [key: string]: unknown;
}

export function processAmazonData(data: AmazonData[]) {
  if (!data) throw new Error('Invalid data');
  if (data.length === 0) throw new Error('No data to process');

  const processedData = data.map((item) => {
    const price = parseFloat(item.price);
    const reviews = parseInt(item.reviews);
    const rating = parseFloat(item.rating);

    if (isNaN(price) || isNaN(reviews) || isNaN(rating)) {
      throw new Error('Invalid data format');
    }

    const performanceScore = (rating / 5) * (reviews / 1000) * 100;
    const conversionRate = 0.1;

    return {
      ...item,
      metrics: {
        price,
        reviews,
        rating,
        performanceScore,
        conversionRate,
      },
      processed: true,
    };
  });

  return processedData;
}
