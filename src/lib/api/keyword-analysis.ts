import { KeywordIntelligence } from '../keyword-intelligence';

export async function fetchKeywordAnalysis(listingData: any) {
  try {
    return await KeywordIntelligence.analyze(listingData);
  } catch (error) {
    console.error('API Route Error:', error);
    throw new Error('Failed to analyze keywords');
  }
}
