import { KeywordUtils } from './keyword-utils';

export interface MarketMetrics {
  searchVolume?: number;
  competition?: 'low' | 'medium' | 'high';
  trend?: 'rising' | 'stable' | 'declining';
  seasonality?: number;
  difficulty?: number;
  relevancy?: number;
  score?: number;
}

export interface CompetitorMetrics {
  price: number;
  reviews: number;
  rating: number;
  marketShare?: number;
  salesVelocity?: number;
  competitivePosition?: 'leader' | 'challenger' | 'follower';
}

export interface ListingMetrics {
  titleScore: number;
  descriptionScore: number;
  imageScore: number;
  keywordScore: number;
  conversionPotential: number;
  overallScore: number;
}

export class MarketAnalysis {
  static calculateMarketMetrics(data: {
    historicalVolume?: number[];
    competitorCount?: number;
    averagePrice?: number;
    seasonalityData?: number[];
  }): MarketMetrics {
    const { historicalVolume, competitorCount, averagePrice, seasonalityData } = data;
    
    // Calculate trend from historical volume
    let trend: MarketMetrics['trend'] = 'stable';
    if (historicalVolume && historicalVolume.length >= 2) {
      const recentChange = ((historicalVolume[historicalVolume.length - 1] - historicalVolume[historicalVolume.length - 2]) / historicalVolume[historicalVolume.length - 2]) * 100;
      trend = recentChange > 5 ? 'rising' : recentChange < -5 ? 'declining' : 'stable';
    }

    // Calculate competition level
    let competition: MarketMetrics['competition'] = 'medium';
    if (competitorCount) {
      competition = competitorCount < 10 ? 'low' : competitorCount > 50 ? 'high' : 'medium';
    }

    // Calculate seasonality factor
    let seasonality = 1;
    if (seasonalityData && seasonalityData.length >= 12) {
      const avg = seasonalityData.reduce((a, b) => a + b, 0) / seasonalityData.length;
      const currentMonth = new Date().getMonth();
      seasonality = seasonalityData[currentMonth] / avg;
    }

    return {
      trend,
      competition,
      seasonality,
      difficulty: competitorCount ? Math.min(competitorCount / 100, 1) : 0.5,
      score: 0 // To be calculated based on multiple factors
    };
  }

  static analyzeCompetitor(metrics: CompetitorMetrics, marketAverages: CompetitorMetrics): CompetitorMetrics {
    const salesVelocity = (metrics.reviews * metrics.rating) / (metrics.price * 0.1);
    const marketShareScore = metrics.reviews / marketAverages.reviews;

    let competitivePosition: CompetitorMetrics['competitivePosition'];
    if (marketShareScore > 1.5) competitivePosition = 'leader';
    else if (marketShareScore > 0.7) competitivePosition = 'challenger';
    else competitivePosition = 'follower';

    return {
      ...metrics,
      salesVelocity,
      marketShare: marketShareScore,
      competitivePosition
    };
  }

  static evaluateListing(listing: {
    title?: string;
    description?: string;
    images?: number;
    keywords?: string[];
    price?: number;
    category?: string;
  }): ListingMetrics {
    const titleScore = listing.title ? 
      Math.min((listing.title.length / 200) * 100, 100) : 0;

    const descriptionScore = listing.description ?
      Math.min((listing.description.length / 2000) * 100, 100) : 0;

    const imageScore = listing.images ?
      Math.min((listing.images / 7) * 100, 100) : 0;

    const keywordScore = listing.keywords ?
      Math.min((listing.keywords.length / 250) * 100, 100) : 0;

    // Calculate conversion potential based on all factors
    const conversionPotential = [
      titleScore * 0.3,
      descriptionScore * 0.2,
      imageScore * 0.3,
      keywordScore * 0.2
    ].reduce((a, b) => a + b, 0);

    return {
      titleScore,
      descriptionScore,
      imageScore,
      keywordScore,
      conversionPotential,
      overallScore: conversionPotential
    };
  }
}