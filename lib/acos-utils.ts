'use client';

import { type ReactNode } from 'react';

export type CampaignData = {
  campaign: string;
  adSpend: number;
  sales: number;
  acos?: number;
  roas?: number;
  impressions?: number;
  clicks?: number;
  ctr?: number;
  cpc?: number;
  conversionRate?: number;
};

export const calculateMetrics = (
  data: Pick<CampaignData, 'adSpend' | 'sales' | 'impressions' | 'clicks'>,
): Omit<CampaignData, 'campaign' | 'adSpend' | 'sales'> => {
  const { adSpend, sales, impressions, clicks } = data;

  const metrics: Omit<CampaignData, 'campaign' | 'adSpend' | 'sales'> = {
    acos: (adSpend / sales) * 100,
    roas: sales / adSpend,
  };

  if (impressions && clicks) {
    metrics.ctr = (clicks / impressions) * 100;
  }

  if (clicks) {
    metrics.cpc = adSpend / clicks;
    metrics.conversionRate = (sales / clicks) * 100;
  }

  return metrics;
};

export const getAcosRating = (acos: number): string => {
  if (acos < 15) return 'Excellent';
  if (acos < 25) return 'Good';
  if (acos < 35) return 'Average';
  if (acos < 45) return 'Poor';
  return 'Critical';
};

export const getAcosColor = (acos: number): string => {
  if (acos < 15) return 'text-green-600 dark:text-green-400';
  if (acos < 25) return 'text-emerald-600 dark:text-emerald-400';
  if (acos < 35) return 'text-yellow-600 dark:text-yellow-400';
  if (acos < 45) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
};

export const chartConfig = {
  acos: {
    label: 'ACoS %',
    theme: { light: '#ef4444', dark: '#f87171' },
  },
  roas: {
    label: 'ROAS',
    theme: { light: '#22c55e', dark: '#4ade80' },
  },
  ctr: {
    label: 'CTR %',
    theme: { light: '#3b82f6', dark: '#60a5fa' },
  },
  cpc: {
    label: 'CPC $',
    theme: { light: '#a855f7', dark: '#c084fc' },
  },
} as const;

export const acosRatingGuide = [
  {
    label: 'Excellent',
    range: '<15%',
    color: 'text-green-600 dark:text-green-400',
  },
  {
    label: 'Good',
    range: '15-25%',
    color: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    label: 'Average',
    range: '25-35%',
    color: 'text-yellow-600 dark:text-yellow-400',
  },
  {
    label: 'Poor',
    range: '35-45%',
    color: 'text-orange-600 dark:text-orange-400',
  },
  { label: 'Critical', range: '>45%', color: 'text-red-600 dark:text-red-400' },
] as const;
