import type { NextApiRequest, NextApiResponse } from 'next';

import { fetchKeywordAnalysis } from '../../lib/api/keyword-analysis';
import { rateLimitRequest } from '../../lib/api/rate-limiter';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  await rateLimitRequest(req, res, async () => {
    if (req.method === 'POST') {
      try {
        const keywords = req.body.keywords as string[];
        const analysisResults = await fetchKeywordAnalysis(keywords);
        res.status(200).json(analysisResults);
      } catch (error: any) {
        console.error('API Route Error:', error);
        res
          .status(500)
          .json({ error: error.message || 'Failed to analyze keywords' });
      }
    } else {
      res.status(405).json({ error: 'Method Not Allowed' });
    }
  });
}
