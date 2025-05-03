import { http, HttpResponse } from 'msw';

interface AnalyzeKeywordsRequest {
  keywords: string[];
}

export const handlers = [
  http.get('/api/connect', () => {
    // Respond with a mocked JSON response
    return HttpResponse.json({
      message: 'Mocked API response',
    });
  }),
  http.post('/keywords/analyze', async ({ request }) => {
    const { keywords } = (await request.json()) as AnalyzeKeywordsRequest;

    if (keywords.includes('error')) {
      return new HttpResponse(null, {
        status: 500,
        statusText: 'Mocked Server Error',
      });
    }

    // Mocked response for keyword analysis
    const mockedResponse = keywords.map((keyword: string) => ({
      keyword: keyword,
      searchVolume: Math.floor(Math.random() * 10000),
      difficulty: Math.random() * 100,
      relevancy: Math.random(),
    }));
    return HttpResponse.json(mockedResponse);
  }),
  http.get('/asin/:asin', () => {
    // Mocked response for ASIN data
    const mockedResponse = {
      asin: 'B07X1V2XDY',
      title: `Mocked Title for ASIN`,
      price: Math.floor(Math.random() * 100),
      cost: Math.floor(Math.random() * 50),
      fbaFees: Math.floor(Math.random() * 20),
      referralFee: Math.floor(Math.random() * 10),
      category: 'Mocked Category',
    };
    return HttpResponse.json(mockedResponse);
  }),
  http.get('/competition/:asin', () => {
    // Mocked response for competition analysis
    const mockedResponse = {
      competitors: Array.from({ length: 3 }, () => ({
        asin: `COMPETITOR_${Math.floor(Math.random() * 3)}`,
        title: `Mocked Competitor Title`,
        price: Math.floor(Math.random() * 100),
        rating: Math.random() * 5,
        reviewCount: Math.floor(Math.random() * 1000),
        sellerType: ['FBA', 'FBM', 'AMZ'][Math.floor(Math.random() * 3)],
      })),
      marketMetrics: {
        averagePrice: Math.floor(Math.random() * 100),
        averageRating: Math.random() * 5,
        averageReviewCount: Math.floor(Math.random() * 1000),
        competitionLevel: ['low', 'medium', 'high'][
          Math.floor(Math.random() * 3)
        ],
      },
    };
    return HttpResponse.json(mockedResponse);
  }),
  http.post('/sales/estimate', async () => {
    // Mocked response for sales estimation
    await new Promise((resolve) => setTimeout(resolve, 500));
    const mockedResponse = {
      estimatedMonthlySales: Math.floor(Math.random() * 1000),
      confidence: Math.random(),
      range: {
        min: Math.floor(Math.random() * 500),
        max: Math.floor(Math.random() * 1500),
      },
    };
    return HttpResponse.json(mockedResponse);
  }),
];
