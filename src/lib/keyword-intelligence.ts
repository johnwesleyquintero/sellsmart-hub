import { ProhibitedKeywords } from './prohibited-keywords';

export interface KeywordAnalysis {

export class KeywordIntelligence {
  static analyze(keywords: string[]): KeywordAnalysis[] {
    return keywords.map(keyword => ({
      keyword,
      isProhibited: false,
      score: 0,
      confidence: 0,
      matchType: 'exact'
    }));
  }
}
  keyword: string;
  isProhibited: boolean;
  score: number;
  confidence: number;
  matchType: 'exact' | 'fuzzy' | 'pattern';
  reason?: string;
}

interface KeywordPattern {
  pattern: RegExp;
  category: string;
  score: number;
}

const patterns: KeywordPattern[] = [
  {
    pattern: /\b(best|top|#1|number\s*one|\d+%\s*off)\b/i,
    category: 'superlative',
    score: 0.8,
  },
  {
    pattern: /\b(guarantee|warranty|lifetime|money\s*back)\b/i,
    category: 'promise',
    score: 0.7,
  },
  {
    pattern: /\b(cure|treat|prevent|heal)\b/i,
    category: 'medical',
    score: 0.9,
  },
];

function calculateSimilarity(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = Array.from({ length: len1 + 1 }, () =>
    Array.from({ length: len2 + 1 }, () => 0),
  );

  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  return 1 - matrix[len1][len2] / Math.max(len1, len2);
}

export async function analyzeKeyword(
  keyword: string,
): Promise<KeywordAnalysis> {
  const prohibitedKeywords = await ProhibitedKeywords.getAll();
  const isProhibited = prohibitedKeywords.includes(keyword.toLowerCase());

  let matchType: KeywordAnalysis['matchType'] = 'exact';
  let score = 0;
  let reason: string | undefined;

  if (isProhibited) {
    score = 1;
    matchType = 'exact';
    reason = 'Keyword is in prohibited list';
  } else {
    // Check patterns
    for (const { pattern, category, score: patternScore } of patterns) {
      if (pattern.test(keyword)) {
        score = Math.max(score, patternScore);
        matchType = 'pattern';
        reason = `Matches ${category} pattern`;
      }
    }

    // Fuzzy match against prohibited keywords
    for (const prohibited of prohibitedKeywords) {
      const similarity = calculateSimilarity(keyword.toLowerCase(), prohibited);
      if (similarity > 0.8) {
        score = Math.max(score, similarity);
        matchType = 'fuzzy';
        reason = `Similar to prohibited keyword: ${prohibited}`;
      }
    }
  }

  return {
    keyword,
    isProhibited,
    score,
    confidence: score > 0.7 ? 0.9 : 0.5,
    matchType,
    reason,
  };
}

export async function analyzeBatch(
  keywords: string[],
): Promise<KeywordAnalysis[]> {
  return Promise.all(keywords.map(analyzeKeyword));
}
