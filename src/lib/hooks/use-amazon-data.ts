import sampleData from '@/data/sample-data.json';
import { useEffect, useState } from 'react';
import type {
  AmazonProduct,
  CompetitorData,
  KeywordData,
} from '../amazon-tools/types';

export function useAmazonData() {
  const [products, setProducts] = useState<AmazonProduct[]>([]);
  const [keywords, setKeywords] = useState<KeywordData[]>([]);
  const [competitors, setCompetitors] = useState<CompetitorData[]>([]);

  useEffect(() => {
    // In a real app, this would fetch from an API
    setProducts(sampleData.products);
    setKeywords(sampleData.keywords);
    setCompetitors(sampleData.competitors);
  }, []);

  return {
    products,
    keywords,
    competitors,
    // Add methods for data manipulation
  };
}
