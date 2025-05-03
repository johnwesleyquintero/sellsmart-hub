import { apiClient } from '@/lib/amazon-tools/api-client';
import type {
  AmazonProduct,
  CompetitorData,
  ProcessedKeywordData, // Changed from KeywordData
} from '@/lib/amazon-types';
import { useEffect, useState } from 'react';

export function useAmazonData(keywords: string[]) {
  const [products, setProducts] = useState<AmazonProduct[]>([]);
  const [keywordData, setKeywordData] = useState<ProcessedKeywordData[]>([]);
  const [competitors, setCompetitors] = useState<CompetitorData[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch keyword data
        const analyzedKeywords = (await apiClient.analyzeKeywords(
          keywords,
        )) as ProcessedKeywordData[];
        setKeywordData(analyzedKeywords);

        // Fetch ASIN data
        const asinData = (await apiClient.getAsinData(
          'B07X1V2XDY',
        )) as AmazonProduct;
        setProducts([asinData]);

        // Fetch competitor data
        const competitorData = await apiClient.analyzeCompetition('B07X1V2XDY');
        const competitorList = competitorData.competitors as CompetitorData[];
        setCompetitors(competitorList);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }

    fetchData();
  }, [keywords]);

  return {
    products,
    keywordData,
    competitors,
    // Add methods for data manipulation
  };
}
