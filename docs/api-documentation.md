# API Documentation

## Internal APIs

### Connect to Database (`src/pages/api/connect.ts`)

- **Endpoint:** `/api/connect`
- **Method:** `GET`
- **Description:** Establishes a connection to the MongoDB database and creates a unique index. This API is automatically called when the application starts.
- **Request Body:** None
- **Response:**
  - **Success (200):**
    ```json
    {
      "message": "Connected to database"
    }
    ```
  - **Error (500):**
    ```json
    {
      "error": "Database connection failed",
      "details": "Error message"
    }
    ```

### Rate Limiter (`src/lib/api/rate-limiter.ts`)

- **Description:** Implements rate limiting using Upstash Redis.
- **Usage:** The `rateLimitRequest` function should be used as middleware in API routes to limit the number of requests from a single IP address. **Example:**

  ```typescript
  import { rateLimitRequest } from './src/lib/api/rate-limiter';

  export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
  ) {
    try {
      await rateLimitRequest(req, res);
      // Your API logic here
      res.status(200).json({ message: 'Success' });
    } catch (error: any) {
      res.status(429).json({ error: error.message });
    }
  }
  ```

- **Configuration:**
  - The rate limiter is configured to allow 15 requests per 10 seconds.
  - The Redis configuration is retrieved using the `getRedisConfig` function.
- **Rate Limit Exceeded (429):**
  ```json
  { "error": "Too many requests" }
  ```

## External APIs (ApiClient in `src/lib/amazon-tools/api-client.ts`)

The `ApiClient` class provides methods for interacting with external APIs related to Amazon seller tools.

- **Base URL:** `process.env.NEXT_PUBLIC_API_BASE_URL` (default: `https://api.example.com`)
- **Authentication:** API Key (passed in the `X-Api-Key` header)

### Analyze Keywords

- **Endpoint:** `/keywords/analyze`
- **Method:** `POST`
- **Description:** Analyzes a list of keywords and returns their search volume, competition, and trend.
- **Request Body:**
  ```json
  {
    "keywords": ["keyword1", "keyword2", ...]
  }
  ```
- **Example Usage:**

  ```typescript
  import ApiClient from './src/lib/amazon-tools/api-client';

  const apiClient = new ApiClient();
  apiClient
    .analyzeKeywords(['keyword1', 'keyword2'])
    .then((data) => console.log(data))
    .catch((error) => console.error(error));
  ```

- **Response:**
  ```json
  [
    {
      "keyword": "keyword1",
      "searchVolume": 1000,
      "competition": 0.5,
      "trend": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    },
    ...
  ]
  ```

### Get ASIN Data

- **Endpoint:** `/asin/{asin}`
- **Method:** `GET`
- **Description:** Retrieves data for a specific ASIN.
- **Path Parameters:**
  - `asin`: The ASIN of the product.
- **Response:**
  ```json
  {
    "title": "Product Title",
    "description": "Product Description",
    "category": "Product Category",
    "price": 25.99,
    "rating": 4.5,
    "reviewCount": 100,
    "bsr": 1
  }
  ```
- **Example Usage:**

  ```typescript
  import ApiClient from './src/lib/amazon-tools/api-client';

  const apiClient = new ApiClient();
  apiClient
    .getAsinData('B012345678')
    .then((data) => console.log(data))
    .catch((error) => console.error(error));
  ```

### Analyze Competition

- **Endpoint:** `/competition/{asin}`
- **Method:** `GET`
- **Description:** Analyzes the competition for a specific ASIN.
- **Path Parameters:**
  - `asin`: The ASIN of the product.
- **Response:**
  ```json
  {
    "competitors": [
      {
        "asin": "B012345678",
        "price": 24.99,
        "rating": 4.4,
        "reviewCount": 90,
        "bsr": 2
      },
      ...
    ],
    "marketMetrics": {
      "averagePrice": 25.49,
      "averageRating": 4.3,
      "averageReviewCount": 95,
      "competitionLevel": "high"
    }
  }
  ```
- **Example Usage:**

  ```typescript
  import ApiClient from './src/lib/amazon-tools/api-client';

  const apiClient = new ApiClient();
  apiClient
    .analyzeCompetition('B012345678')
    .then((data) => console.log(data))
    .catch((error) => console.error(error));
  ```

### Estimate Sales

- **Endpoint:** `/sales/estimate`
- **Method:** `POST`
- **Description:** Estimates the monthly sales for a product based on its category, BSR, and price.
- **Request Body:**
  ```json
  {
    "category": "Product Category",
    "bsr": 1,
    "price": 25.99
  }
  ```
- **Response:**
  ```json
  {
    "estimatedMonthlySales": 1000,
    "confidence": 0.8,
    "range": { "min": 800, "max": 1200 }
  }
  ```
- **Example Usage:**

  ```typescript
  import ApiClient from './src/lib/amazon-tools/api-client';

  const apiClient = new ApiClient();
  apiClient
    .estimateSales('Product Category', 1, 25.99)
    .then((data) => console.log(data))
    .catch((error) => console.error(error));
  ```

## Keyword Intelligence API (`src/lib/api/keyword-analysis.ts`)

- **Description:** Analyzes keywords using the `KeywordIntelligence` class.
- **Usage:** The `fetchKeywordAnalysis` function takes an array of keywords as input and returns the analysis results.
- **Example:**

  ```typescript
  import { fetchKeywordAnalysis } from './src/lib/api/keyword-analysis';

  async function analyzeKeywords(keywords: string[]) {
    try {
      const results = await fetchKeywordAnalysis(keywords);
      console.log(results);
    } catch (error) {
      console.error(error);
    }
  }

  analyzeKeywords(['keyword1', 'keyword2']);
  ```
