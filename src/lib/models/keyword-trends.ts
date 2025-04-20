
export interface KeywordTrend {
  _id?: string;
  keyword: string;
  date: string;
  volume: number;
  createdAt: Date;
}

export interface KeywordTrendData {
  name: string;
  [keyword: string]: number | string;
}

export const KeywordTrendCollection = 'keyword-trends';
