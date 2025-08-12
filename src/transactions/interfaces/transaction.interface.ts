import { ObjectId } from 'mongodb';

export interface Transaction {
  _id?: ObjectId;
  userId: ObjectId;
  budgetId: ObjectId;
  amount: number;
  currency: string;
  type: 'income' | 'expense';
  category: string;
  subcategory?: string;
  description: string;
  date: Date;
  paymentMethod: 'cash' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'digital_wallet' | 'other';
  isRecurring: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
