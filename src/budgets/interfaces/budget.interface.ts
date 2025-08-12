import { ObjectId } from 'mongodb';

export interface Budget {
  _id?: ObjectId;
  userId: ObjectId;
  name: string;
  description?: string;
  totalAmount: number;
  spentAmount: number;
  remainingAmount: number;
  currency: string;
  category: string;
  period: 'weekly' | 'monthly' | 'yearly' | 'custom';
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
