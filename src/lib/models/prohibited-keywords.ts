export interface ProhibitedKeyword {
  _id?: string;
  keyword: string;
  createdAt: Date;
  updatedAt: Date;
}

export const ProhibitedKeywordCollection = 'prohibited-keywords';
