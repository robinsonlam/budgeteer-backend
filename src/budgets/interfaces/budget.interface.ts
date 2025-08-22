import { ObjectId } from 'mongodb';

export interface Budget {
  _id?: ObjectId;
  userId: ObjectId;
  name: string;
  description?: string;
  startDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  startingBalance?: number; // default to 0
}
