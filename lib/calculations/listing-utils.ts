import { ListingMetrics } from './market-analysis';

export interface SEOMetrics {
  keywordDensity: number;
  keywordPlacement: number;
  titleOptimization: number;
  descriptionOptimization: number;
  overallScore: number;
}

export interface ConversionMetrics {
  readability: number;
  featureCoverage: number;
  benefitClarity: number;
  socialProof: number;
  overallScore: number;
}

export class ListingUtils {
  static analyzeSEO(listing: {
    title: string;
    description: string;
    bulletPoints: string[];
    keywords: string[];
  }): SEOMetrics {
    // Calculate keyword density
    const allContent = `${listing.title} ${listing.description} ${listing.bulletPoints.join(' ')}`;
    const contentWords = allContent.toLowerCase().split(/\s+/);
    const keywordMatches = listing.keywords.reduce((count, keyword) => {
      const keywordRegex = new RegExp(keyword.toLowerCase(), 'g');
      return count + (allContent.toLowerCase().match(keywordRegex)?.length || 0);
    }, 0);
    const keywordDensity = (keywordMatches / contentWords.length) * 100;

    // Analyze keyword placement in title
    const titleWords = listing.title.toLowerCase().split(/\s+/);
    const keywordsInTitle = listing.keywords.filter(keyword =>
      titleWords.includes(keyword.toLowerCase())
    ).length;
    const keywordPlacement = (keywordsInTitle / listing.keywords.length) * 100;

    // Calculate title optimization
    const titleLength = listing.title.length;
    const titleOptimization = Math.min((titleLength / 200) * 100, 100);

    // Calculate description optimization
    const descriptionLength = listing.description.length;
    const descriptionOptimization = Math.min((descriptionLength / 2000) * 100, 100);

    // Calculate overall SEO score
    const overallScore = [
      keywordDensity * 0.3,
      keywordPlacement * 0.3,
      titleOptimization * 0.2,
      descriptionOptimization * 0.2
    ].reduce((a, b) => a + b, 0);

    return {
      keywordDensity,
      keywordPlacement,
      titleOptimization,
      descriptionOptimization,
      overallScore
    };
  }

  static analyzeConversion(listing: {
    title: string;
    description: string;
    bulletPoints: string[];
    images: number;
    reviews?: number;
    rating?: number;
  }): ConversionMetrics {
    // Calculate readability score
    const readabilityScore = this.calculateReadabilityScore(
      listing.description,
      listing.bulletPoints
    );

    // Analyze feature coverage
    const featureCoverage = Math.min(
      (listing.bulletPoints.length / 5) * 100,
      100
    );

    // Calculate benefit clarity
    const benefitClarity = this.analyzeBenefitClarity(
      listing.description,
      listing.bulletPoints
    );

    // Calculate social proof score
    const socialProof = listing.reviews && listing.rating
      ? Math.min((listing.reviews / 1000) * 100, 100) * (listing.rating / 5)
      : 50;

    // Calculate overall conversion score
    const overallScore = [
      readabilityScore * 0.3,
      featureCoverage * 0.2,
      benefitClarity * 0.3,
      socialProof * 0.2
    ].reduce((a, b) => a + b, 0);

    return {
      readability: readabilityScore,
      featureCoverage,
      benefitClarity,
      socialProof,
      overallScore
    };
  }

  private static calculateReadabilityScore(
    description: string,
    bulletPoints: string[]
  ): number {
    const content = `${description} ${bulletPoints.join(' ')}`;
    const sentences = content.split(/[.!?]+/).length;
    const words = content.split(/\s+/).length;
    const avgWordsPerSentence = words / sentences;

    // Penalize for very long or very short sentences
    const sentenceLengthScore = Math.max(
      0,
      100 - Math.abs(avgWordsPerSentence - 15) * 5
    );

    return sentenceLengthScore;
  }

  private static analyzeBenefitClarity(
    description: string,
    bulletPoints: string[]
  ): number {
    const benefitIndicators = [
      'improve',
      'enhance',
      'increase',
      'better',
      'save',
      'reduce',
      'prevent',
      'protect',
      'guarantee',
      'perfect for',
      'ideal for',
      'designed for'
    ];

    const content = `${description} ${bulletPoints.join(' ')}`;
    const benefitMatches = benefitIndicators.reduce((count, indicator) => {
      const regex = new RegExp(indicator, 'gi');
      return count + (content.match(regex)?.length || 0);
    }, 0);

    return Math.min(benefitMatches * 10, 100);
  }
}