interface MarketMetrics {
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
  private static calculateHistoricalScore(volume?: number[]): number {
    if (!volume?.length) return 0;
    return Math.min(volume.reduce((a, b) => a + b, 0) / volume.length, 100);
  }

  private static calculateCompetitionScore(count?: number): number {
    return count ? Math.min(count * 0.5, 100) : 50;
  }

  private static calculateSeasonalityScore(data?: number[]): number {
    if (!data?.length) return 100;
    const variance = Math.max(...data) - Math.min(...data);
    return Math.min(100 - (variance * 10), 100);
  }

  static calculateMarketMetrics(data: {
    historicalVolume?: number[];
    competitorCount?: number;
    seasonalityData?: number[];
  }): MarketMetrics {
    // Removed unused variables
    // const historicalScore = this.calculateHistoricalScore(data.historicalVolume);
    // const competitionScore = this.calculateCompetitionScore(data.competitorCount);
    // const seasonalityScore = this.calculateSeasonalityScore(data.seasonalityData);

    let trend: MarketMetrics['trend'] = 'stable';
    if (data.historicalVolume && data.historicalVolume.length >= 2) {
      const recentChange =
        ((data.historicalVolume[data.historicalVolume.length - 1] -
          data.historicalVolume[data.historicalVolume.length - 2]) /
          data.historicalVolume[data.historicalVolume.length - 2]) *
        100;
      if (recentChange > 5) {
        trend = 'rising';
      } else if (recentChange < -5) {
        trend = 'declining';
      }
      // Removed redundant assignment to 'trend'
    }

    let competition: MarketMetrics['competition'] = 'medium';
    if (data.competitorCount) {
      if (data.competitorCount < 10) {
        competition = 'low';
      } else if (data.competitorCount > 50) {
        competition = 'high';
      }
      // Removed redundant assignment to 'competition'
    }

    let seasonality = 1;
    if (data.seasonalityData && data.seasonalityData.length >= 12) {
      const avg =
        data.seasonalityData.reduce((a, b) => a + b, 0) / data.seasonalityData.length;
      const currentMonth = new Date().getMonth();
      seasonality = data.seasonalityData[currentMonth] / avg;
    }

    return {
      trend,
      competition,
      seasonality,
      difficulty: data.competitorCount ? Math.min(data.competitorCount / 100, 1) : 0.5,
      score: 0,
    };
  }

  static analyzeCompetitor(
    metrics: CompetitorMetrics,
    marketAverages: CompetitorMetrics,
  ): CompetitorMetrics {
    const salesVelocity =
      (metrics.reviews * metrics.rating) / (metrics.price * 0.1);
    const marketShareScore = metrics.reviews / marketAverages.reviews;

    let competitivePosition: CompetitorMetrics['competitivePosition'];
    if (marketShareScore > 1.5) competitivePosition = 'leader';
    else if (marketShareScore > 0.7) competitivePosition = 'challenger';
    else competitivePosition = 'follower';

    return {
      ...metrics,
      salesVelocity,
      marketShare: marketShareScore,
      competitivePosition,
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
    const titleScore = listing.title
      ? Math.min((listing.title.length / 200) * 100, 100)
      : 0;

    const descriptionScore = listing.description
      ? Math.min((listing.description.length / 2000) * 100, 100)
      : 0;

    const imageScore = listing.images
      ? Math.min((listing.images / 7) * 100, 100)
      : 0;

    const keywordScore = listing.keywords
      ? Math.min((listing.keywords.length / 250) * 100, 100)
      : 0;

    const conversionPotential = [
      titleScore * 0.3,
      descriptionScore * 0.2,
      imageScore * 0.3,
      keywordScore * 0.2,
    ].reduce((a, b) => a + b, 0);

    return {
      titleScore,
      descriptionScore,
      imageScore,
      keywordScore,
      conversionPotential,
      overallScore: conversionPotential,
    };
  }
}
