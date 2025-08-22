import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ObjectId } from 'mongodb';

export interface TotalBalanceParams {
  _id: ObjectId;
  startBalance?: number;
}

@Injectable()
export class MetricsService {
  constructor(private databaseService: DatabaseService) {}

  private get transactionsCollection() {
    return this.databaseService.getDb().collection('transactions');
  }

  // Calculates the total balance for a budget (startBalance + sum of all transaction amounts)
  async calculateTotalBalance(budget: TotalBalanceParams): Promise<number> {
    const startBalance = typeof budget.startBalance === 'number' ? budget.startBalance : 0;
    const result = await this.transactionsCollection.aggregate([
      { $match: { budgetId: budget._id } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]).toArray();
    const transactionsTotal = result[0]?.total || 0;
    return startBalance + transactionsTotal;
  }
}
