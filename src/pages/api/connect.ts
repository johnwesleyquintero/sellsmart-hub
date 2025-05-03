import type { NextApiRequest, NextApiResponse } from 'next';

import { validateKeywords } from '@/lib/input-validation';
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
        const errors = validateKeywords(keywords);

        if (errors.length > 0) {
          return res.status(400).json({ error: errors.join(', ') });
        }

        const listingData = { title: keywords.join(', ') };
        const analysisResults = await fetchKeywordAnalysis(listingData);
        res.status(200).json(analysisResults);
      } catch (error: unknown) {
        console.error('API Route Error:', error);
        res
          .status(500)
          .json({
            error: (error as Error).message || 'Failed to analyze keywords',
          });
      }
    } else {
      res.status(405).json({ error: 'Method Not Allowed' });
    }
  });
}
