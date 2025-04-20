import { type ProductListingData } from '../amazon-types';

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
}

const WEIGHTS = {
  title: 0.2,
  bulletPoints: 0.2,
  description: 0.15,
  images: 0.15,
  reviews: 0.15,
  aPlus: 0.1,
  fulfillment: 0.05,
};

const scoreTitleQuality = (title: string): number => {
  if (!title) return 0;
  const length = title.length;
  // Amazon title length limit is 200 characters
  // Optimal length is between 150-200 characters
  if (length > 200) return 5; // Penalize for being too long
  if (length >= 150) return 10;
  if (length >= 100) return 8;
  if (length >= 50) return 6;
  return 4;
};

const scoreBulletPoints = (bullets: string[]): number => {
  if (!bullets?.length) return 0;
  const count = bullets.length;
  const avgLength =
    bullets.reduce((sum, bullet) => sum + bullet.length, 0) / count;

  let score = 0;
  // Score for number of bullets (max 5 allowed)
  score += Math.min(count, 5) * 1.5;
  // Score for average length (optimal 150-200 characters per bullet)
  if (avgLength >= 150 && avgLength <= 200) score += 2.5;
  else if (avgLength >= 100) score += 1.5;

  return Math.min(score, 10);
};

const scoreDescription = (description: string): number => {
  if (!description) return 0;
  const length = description.length;
  // Use a safer regex to detect HTML tags, avoiding potential ReDoS.
  // This regex looks for '<', followed by one or more characters that are NOT '>', then '>'.
  // It's less likely to cause catastrophic backtracking compared to /<.+?>/
  // eslint-disable-next-line sonarjs/slow-regex
  const hasHtmlTags = /<[^>]+>/.test(description); // Changed regex here

  let score = 0;
  // Score for length (optimal 2000+ characters)
  if (length >= 2000) score += 6;
  else if (length >= 1500) score += 5;
  else if (length >= 1000) score += 4;
  else if (length >= 500) score += 3;

  // Score for HTML formatting
  if (hasHtmlTags) score += 4;

  return Math.min(score, 10);
};

const scoreImages = (imageCount: number): number => {
  if (!imageCount) return 0;
  // Amazon allows up to 9 images
  // Ensure division by 9 doesn't happen if imageCount is 0, although checked above.
  return Math.min(imageCount, 9) * (10 / 9);
};

const scoreReviews = (rating: number, reviewCount: number): number => {
  if (!rating || !reviewCount) return 0;

  let score = 0;
  // Score for rating (0-5 stars)
  score += (rating / 5) * 5;

  // Score for review count
  if (reviewCount >= 1000) score += 5;
  else if (reviewCount >= 500) score += 4;
  else if (reviewCount >= 100) score += 3;
  else if (reviewCount >= 50) score += 2;
  else score += 1;

  return Math.min(score, 10);
};

const generateSuggestions = (scores: ProductScore['breakdown']): string[] => {
  const suggestions: string[] = [];

  if (scores.title < 7) {
    suggestions.push(
      'Optimize your title length to be between 150-200 characters while including relevant keywords.',
    );
  }

  if (scores.bulletPoints < 7) {
    suggestions.push(
      'Add more bullet points (aim for 5) and ensure each is between 150-200 characters.',
    );
  }

  if (scores.description < 7) {
    suggestions.push(
      'Enhance your description by adding more content (aim for 2000+ characters) and use HTML formatting for better readability.',
    );
  }

  if (scores.images < 7) {
    suggestions.push(
      'Add more high-quality images (aim for 7-9 images) to showcase your product better.',
    );
  }

  if (scores.reviews < 5) {
    suggestions.push(
      'Focus on gathering more customer reviews and maintaining a high rating.',
    );
  }

  if (scores.aPlus === 0) {
    suggestions.push(
      'Consider adding A+ Content to enhance your product listing.',
    );
  }

  if (scores.fulfillment < 5) {
    suggestions.push(
      'Consider using FBA to potentially improve your product visibility and customer trust.',
    );
  }

  return suggestions;
};

export const calculateProductScore = (
  data: ProductListingData,
): ProductScore => {
  const breakdown = {
    title: scoreTitleQuality(data.title),
    bulletPoints: scoreBulletPoints(data.bulletPoints),
    description: scoreDescription(data.description),
    images: scoreImages(data.imageCount),
    reviews: scoreReviews(data.rating, data.reviewCount),
    aPlus: data.hasAPlusContent ? 10 : 0,
    fulfillment: data.fulfillmentType === 'FBA' ? 10 : 5,
  };

  const overall = Object.entries(breakdown).reduce((sum, [key, score]) => {
    // Ensure the key exists in WEIGHTS before using it
    const weightKey = key as keyof typeof WEIGHTS;
    if (WEIGHTS[weightKey] !== undefined) {
      return sum + score * WEIGHTS[weightKey];
    }
    return sum;
  }, 0);

  const suggestions = generateSuggestions(breakdown);

  return {
    overall: Math.round(overall * 10) / 10, // Round to 1 decimal place
    breakdown,
    suggestions,
  };
};
