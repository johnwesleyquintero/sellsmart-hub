import { KeywordIntelligence } from '../keyword-intelligence';

export async function fetchKeywordAnalysis(keywords: string[]) {
  return await KeywordIntelligence.analyze(keywords);
}
