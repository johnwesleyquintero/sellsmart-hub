export class KeywordUtils {
  static calculateKeywordScore(keyword) {
    const volumeScore = this.calculateVolumeScore(keyword.searchVolume);
    const difficultyScore = this.calculateDifficultyScore(keyword.difficulty);
    const relevancyScore = keyword.relevancy;
    return volumeScore * 0.4 + difficultyScore * 0.3 + relevancyScore * 0.3;
  }
  static calculateVolumeScore(volume) {
    if (volume >= this.THRESHOLDS.highVolume) return 100;
    if (volume >= this.THRESHOLDS.mediumVolume) return 75;
    return (volume / this.THRESHOLDS.mediumVolume) * 75;
  }
  static calculateDifficultyScore(difficulty) {
    // Inverse score - lower difficulty is better
    return Math.max(0, 100 - difficulty);
  }
  static analyzeTrend(historicalData) {
    if (historicalData.length < 2) return { trend: 'stable', changePercent: 0 };
    const first = historicalData[0];
    const last = historicalData[historicalData.length - 1];
    const changePercent = ((last - first) / first) * 100;
    return {
      trend: changePercent > 5 ? 'up' : changePercent < -5 ? 'down' : 'stable',
      changePercent: Number(changePercent.toFixed(2)),
    };
  }
  static prioritizeKeywords(keywords) {
    return keywords
      .map((keyword) =>
        Object.assign(Object.assign({}, keyword), {
          score: this.calculateKeywordScore(keyword),
        }),
      )
      .sort((a, b) => (b.score || 0) - (a.score || 0));
  }
}
KeywordUtils.THRESHOLDS = {
  highVolume: 10000,
  mediumVolume: 3000,
  highDifficulty: 80,
  mediumDifficulty: 50,
  minimumRelevancy: 50,
};
