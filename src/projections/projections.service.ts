import { Injectable } from '@nestjs/common';
import { MetricsService } from '../metrics/metrics.service';
import { ObjectId } from 'mongodb';

export interface ProjectedYearEndBalanceParams {
  _id: ObjectId;
  startBalance?: number;
  currentDate?: Date;
}

@Injectable()
export class ProjectionsService {
  constructor(private metricsService: MetricsService) {}

  // Calculates the projected year-end balance based on current balance and monthly medians
  async calculateProjectedYearEndBalance(budget: ProjectedYearEndBalanceParams): Promise<number> {
    const currentDate = budget.currentDate || new Date();
    const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
    const remainingMonths = 12 - currentMonth;

    // If we're in December or later, return current balance (no projection needed)
    if (remainingMonths <= 0) {
      return this.metricsService.calculateTotalBalance({ _id: budget._id, startBalance: budget.startBalance });
    }

    // Get current balance, monthly income median, and monthly expense median
    const [currentBalance, monthlyIncomeMedian, monthlyExpenseMedian] = await Promise.all([
      this.metricsService.calculateTotalBalance({ _id: budget._id, startBalance: budget.startBalance }),
      this.metricsService.calculateMonthlyIncomeMedian({ _id: budget._id }),
      this.metricsService.calculateMonthlyExpenseMedian({ _id: budget._id })
    ]);

    // Calculate projected year-end balance
    const monthlyNetFlow = monthlyIncomeMedian - monthlyExpenseMedian;
    const projectedYearEndBalance = currentBalance + (monthlyNetFlow * remainingMonths);

    return projectedYearEndBalance;
  }
}
