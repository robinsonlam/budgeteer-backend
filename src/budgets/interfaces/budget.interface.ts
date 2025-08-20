import { ObjectId } from 'mongodb';
import { BudgetType } from '../../common/enums';

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
  period: BudgetType;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
