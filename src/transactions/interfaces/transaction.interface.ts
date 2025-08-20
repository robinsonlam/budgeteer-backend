import { ObjectId } from 'mongodb';
import { TransactionType, PaymentMethod, RecurringFrequency } from '../../common/enums';

export interface Transaction {
  _id?: ObjectId;
  userId: ObjectId;
  budgetId: ObjectId;
  amount: number;
  type: TransactionType;
  category: string;
  subcategory?: string;
  description: string;
  date: Date;
  paymentMethod: PaymentMethod;
  isRecurring: boolean;
  recurringFrequency?: RecurringFrequency;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
