var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
import { ProhibitedKeywords } from './prohibited-keywords';
export class KeywordIntelligence {
  static analyzeBatch(keywords) {
    return __awaiter(this, void 0, void 0, function* () {
      return Promise.all(
        keywords.map((keyword) => this.analyzeKeyword(keyword)),
      );
    });
  }
  static calculateSimilarity(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix = Array(len1 + 1)
      .fill(null)
      .map(() => Array(len2 + 1).fill(0));
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
  static analyzeKeyword(keyword) {
    return __awaiter(this, void 0, void 0, function* () {
      const prohibitedKeywords = yield ProhibitedKeywords.getAll();
      const normalizedKeyword = keyword.toLowerCase().trim();
      // Check for exact matches in prohibited keywords
      if (prohibitedKeywords.includes(normalizedKeyword)) {
        return {
          keyword,
          isProhibited: true,
          score: 1.0,
          confidence: 1.0,
          matchType: 'exact',
          reason: 'Exact match in prohibited keywords database',
        };
      }
      // Check for fuzzy matches
      const fuzzyMatches = prohibitedKeywords.map((pk) => ({
        keyword: pk,
        similarity: this.calculateSimilarity(
          normalizedKeyword,
          pk.toLowerCase(),
        ),
      }));
      const bestFuzzyMatch = fuzzyMatches.reduce(
        (best, current) =>
          current.similarity > best.similarity ? current : best,
        { keyword: '', similarity: 0 },
      );
      if (bestFuzzyMatch.similarity > 0.85) {
        return {
          keyword,
          isProhibited: true,
          score: bestFuzzyMatch.similarity,
          confidence: bestFuzzyMatch.similarity,
          matchType: 'fuzzy',
          reason: `Similar to prohibited keyword: ${bestFuzzyMatch.keyword}`,
        };
      }
      // Check for pattern matches
      for (const pattern of this.patterns) {
        if (pattern.pattern.test(normalizedKeyword)) {
          return {
            keyword,
            isProhibited: true,
            score: pattern.score,
            confidence: pattern.score,
            matchType: 'pattern',
            reason: `Matches ${pattern.category} pattern`,
          };
        }
      }
      return {
        keyword,
        isProhibited: false,
        score: 0,
        confidence: 1.0,
        matchType: 'exact',
      };
    });
  }
}
KeywordIntelligence.patterns = [
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
