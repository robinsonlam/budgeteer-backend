import { ObjectId } from 'mongodb';

export interface Budget {
  _id?: ObjectId;
  userId: ObjectId;
  name: string;
  description?: string;
  startDate: Date;
  isActive: boolean;
  startBalance?: number; // default to 0 if not provided
  createdAt: Date;
  updatedAt: Date;
}
