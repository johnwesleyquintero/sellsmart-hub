import { ObjectId } from 'mongodb';

export interface ProhibitedKeyword {
  _id?: ObjectId;
  keyword: string;
  createdAt: Date;
  updatedAt: Date;
}

export const ProhibitedKeywordCollection = 'prohibited-keywords';
