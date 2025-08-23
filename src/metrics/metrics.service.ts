import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ObjectId } from 'mongodb';
import { TransactionType } from '../common/enums';

export interface TotalBalanceParams {
  _id: ObjectId;
  startBalance?: number;
}

export interface MonthlyIncomeParams {
  _id: ObjectId;
}

export interface MonthlyExpenseParams {
  _id: ObjectId;
}

@Injectable()
export class MetricsService {
  constructor(private databaseService: DatabaseService) {}

  private get transactionsCollection() {
    return this.databaseService.getDb().collection('transactions');
  }

  // Calculates the total balance for a budget (startBalance + income transactions - expense transactions)
  async calculateTotalBalance(budget: TotalBalanceParams): Promise<number> {
    const startBalance = typeof budget.startBalance === 'number' ? budget.startBalance : 0;
    
    const result = await this.transactionsCollection.aggregate([
      { $match: { budgetId: budget._id } },
      { 
        $group: { 
          _id: null, 
          totalIncome: { 
            $sum: { 
              $cond: [{ $eq: ['$type', TransactionType.INCOME] }, '$amount', 0] 
            } 
          },
          totalExpenses: { 
            $sum: { 
              $cond: [{ $eq: ['$type', TransactionType.EXPENSE] }, '$amount', 0] 
            } 
          }
        } 
      }
    ]).toArray();

    const totals = result[0] || { totalIncome: 0, totalExpenses: 0 };
    return startBalance + totals.totalIncome - totals.totalExpenses;
  }

  // Calculates the median monthly income for a budget by grouping income transactions by month
  async calculateMonthlyIncomeMedian(budget: MonthlyIncomeParams): Promise<number> {
    const result = await this.transactionsCollection.aggregate([
      { 
        $match: { 
          budgetId: budget._id,
          type: TransactionType.INCOME
        } 
      },
      {
        $addFields: {
          yearMonth: {
            $dateToString: {
              format: "%Y-%m",
              date: "$date"
            }
          }
        }
      },
      {
        $group: {
          _id: "$yearMonth",
          monthlyIncome: { $sum: "$amount" }
        }
      },
      {
        $sort: { monthlyIncome: 1 }
      }
    ]).toArray();

    if (result.length === 0) {
      return 0;
    }

    // Calculate median
    const incomes = result.map(r => r.monthlyIncome);
    const middle = Math.floor(incomes.length / 2);

    if (incomes.length % 2 === 0) {
      // Even number of months - average of two middle values
      return (incomes[middle - 1] + incomes[middle]) / 2;
    } else {
      // Odd number of months - middle value
      return incomes[middle];
    }
  }

  // Calculates the median monthly expense for a budget by grouping expense transactions by month
  async calculateMonthlyExpenseMedian(budget: MonthlyExpenseParams): Promise<number> {
    const result = await this.transactionsCollection.aggregate([
      { 
        $match: { 
          budgetId: budget._id,
          type: TransactionType.EXPENSE
        } 
      },
      {
        $addFields: {
          yearMonth: {
            $dateToString: {
              format: "%Y-%m",
              date: "$date"
            }
          }
        }
      },
      {
        $group: {
          _id: "$yearMonth",
          monthlyExpense: { $sum: "$amount" }
        }
      },
      {
        $sort: { monthlyExpense: 1 }
      }
    ]).toArray();

    if (result.length === 0) {
      return 0;
    }

    // Calculate median
    const expenses = result.map(r => r.monthlyExpense);
    const middle = Math.floor(expenses.length / 2);

    if (expenses.length % 2 === 0) {
      // Even number of months - average of two middle values
      return (expenses[middle - 1] + expenses[middle]) / 2;
    } else {
      // Odd number of months - middle value
      return expenses[middle];
    }
  }
}
