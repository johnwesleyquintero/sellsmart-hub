import { parse } from 'node-html-parser';
import { type ProductListingData } from '../amazon-types';
import { createCalculationError, logError } from '../error-handling';
import { validateProductListing } from '../input-validation';
import { logger } from '../logger';
import {
  defaultScoringConfig,
  getScoreMessage,
  type ScoringConfig,
  type ScoringRule,
} from './scoring-config';

export interface ProductScore {
  overall: number;
  breakdown: {
    title: number;
    bulletPoints: number;
    description: number;
    images: number;
    reviews: number;
    aPlus: number;
    fulfillment: number;
  };
  suggestions: string[];
  messages: Record<string, string>;
}

const applyThresholdScoring = (value: number, rule: ScoringRule): number => {
  if (rule.customScoring) {
    return rule.customScoring(value);
  }

  const threshold = rule.thresholds.find((t) => value >= t.value);
  return threshold ? threshold.score : 0;
};

const scoreDescription = (description: string): number => {
  if (!description) return 0;
  const length = description.length;

  // Use HTML parser for more accurate tag detection
  const root = parse(description);
  const hasFormattedText =
    root.querySelectorAll(
      'p, br, ul, ol, li, h1, h2, h3, h4, h5, h6, strong, em, b, i',
    ).length > 0;

  const lengthScore = applyThresholdScoring(
    length,
    defaultScoringConfig.description,
  );
  const formattingScore = hasFormattedText ? 2 : 0;

  return Math.min(lengthScore + formattingScore, 10);
};

const generateSuggestions = (
  scores: ProductScore['breakdown'],
  config: ScoringConfig,
): ProductScore['suggestions'] => {
  const suggestions: string[] = [];
  const messages: Record<string, string> = {};

  Object.entries(scores).forEach(([key, score]) => {
    const rule = config[key as keyof ScoringConfig];
    const threshold = score / 10; // Convert score to 0-1 scale
    const message = getScoreMessage(rule, threshold);

    if (message) {
      messages[key] = message;
    }

    if (score < 7) {
      switch (key) {
        case 'title':
          suggestions.push(
            'Optimize title length (150-200 characters) with relevant keywords.',
          );
          break;
        case 'bulletPoints':
          suggestions.push(
            'Add 5 bullet points, each 150-200 characters, highlighting key features.',
          );
          break;
        case 'description':
          suggestions.push(
            'Expand description to 2000+ characters with proper HTML formatting.',
          );
          break;
        case 'images':
          suggestions.push(
            'Include 7-9 high-quality images showing product features and benefits.',
          );
          break;
        case 'reviews':
          suggestions.push(
            'Implement strategies to gather more customer reviews while maintaining quality.',
          );
          break;
        case 'aPlus':
          suggestions.push(
            'Add A+ Content to enhance product presentation and conversion rate.',
          );
          break;
        case 'fulfillment':
          suggestions.push(
            'Consider FBA to improve visibility and customer trust.',
          );
          break;
      }
    }
  });

  return { suggestions, messages };
};

export const calculateProductScore = (
  data: ProductListingData,
  config: ScoringConfig = defaultScoringConfig,
): ProductScore => {
  try {
    const validationResult = validateProductListing(data);
    if (!validationResult.success) {
      throw createCalculationError('Invalid product data', {
        errors: validationResult.error.errors,
      });
    }

    logger.info('Calculating product score', { asin: data.asin });
    const breakdown = {
      title: applyThresholdScoring(data.title?.length || 0, config.title),
      bulletPoints: config.bulletPoints.customScoring?.(data.bulletPoints) || 0,
      description: scoreDescription(data.description),
      images: applyThresholdScoring(data.imageCount || 0, config.images),
      reviews:
        config.reviews.customScoring?.({
          rating: data.rating,
          count: data.reviewCount,
        }) || 0,
      aPlus: applyThresholdScoring(data.hasAPlusContent ? 1 : 0, config.aPlus),
      fulfillment: applyThresholdScoring(
        data.fulfillmentType === 'FBA' ? 1 : 0,
        config.fulfillment,
      ),
    };

    const overall = Object.entries(breakdown).reduce((sum, [key, score]) => {
      const rule = config[key as keyof ScoringConfig];
      return sum + score * rule.weight;
    }, 0);

    const { suggestions, messages } = generateSuggestions(breakdown, config);

    const result = {
      overall: Math.round(overall * 10) / 10,
      breakdown,
      suggestions,
      messages,
    };

    logger.info('Product score calculated successfully', {
      asin: data.asin,
      score: result.overall,
    });

    return result;
  } catch (error) {
    const errorMetadata = logError(error as Error, {
      component: 'scoring-utils',
      data,
      config,
    });
    throw createCalculationError(
      'Failed to calculate product score',
      errorMetadata,
    );
  }
};
