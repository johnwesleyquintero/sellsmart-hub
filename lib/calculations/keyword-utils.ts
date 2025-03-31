import { KeywordData } from '../amazon-types';

export class KeywordUtils {
    static readonly THRESHOLDS = {
        highVolume: 10000,
        mediumVolume: 3000,
        highDifficulty: 80,
        mediumDifficulty: 50,
        minimumRelevancy: 50,
    };

    static calculateKeywordScore(keyword: KeywordData): number {
        const volumeScore = this.calculateVolumeScore(keyword.searchVolume);
        const difficultyScore = this.calculateDifficultyScore(keyword.difficulty);
        const relevancyScore = keyword.relevancy;

        return (volumeScore * 0.4 + difficultyScore * 0.3 + relevancyScore * 0.3);
    }

    private static calculateVolumeScore(volume: number): number {
        if (volume >= this.THRESHOLDS.highVolume) return 100;
        if (volume >= this.THRESHOLDS.mediumVolume) return 75;
        return (volume / this.THRESHOLDS.mediumVolume) * 75;
    }

    private static calculateDifficultyScore(difficulty: number): number {
        // Inverse score - lower difficulty is better
        return Math.max(0, 100 - difficulty);
    }

    static analyzeTrend(historicalData: number[]): {
        trend: 'up' | 'down' | 'stable';
        changePercent: number;
    } {
        if (historicalData.length < 2) return { trend: 'stable', changePercent: 0 };

        const first = historicalData[0];
        const last = historicalData[historicalData.length - 1];
        const changePercent = ((last - first) / first) * 100;

        return {
            trend: changePercent > 5 ? 'up' : changePercent < -5 ? 'down' : 'stable',
            changePercent: Number(changePercent.toFixed(2)),
        };
    }

    static prioritizeKeywords(keywords: KeywordData[]): KeywordData[] {
        return keywords
            .map(keyword => ({
                ...keyword,
                score: this.calculateKeywordScore(keyword),
            }))
            .sort((a, b) => (b.score || 0) - (a.score || 0));
    }
}
