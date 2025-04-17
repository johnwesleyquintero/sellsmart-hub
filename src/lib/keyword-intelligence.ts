export interface KeywordAnalysis {
  keyword: string;
  isProhibited: boolean;
  score: number;
  confidence: number;
  matchType: 'exact' | 'fuzzy' | 'pattern';
  reason?: string;
}

export const KeywordIntelligence = {
  analyze(keywords: string[]): KeywordAnalysis[] {
    return keywords.map((keyword) => ({
      keyword,
      isProhibited: false,
      score: 0,
      confidence: 0,
      matchType: 'exact',
    }));
  },
};
