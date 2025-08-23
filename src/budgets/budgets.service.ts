import { normalizePositiveNumber } from './utils';
import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Budget } from './interfaces/budget.interface';
import { CreateBudgetDto, UpdateBudgetDto } from './dto/budget.dto';
import { ObjectId } from 'mongodb';
import { MetricsService, TotalBalanceParams, MonthlyIncomeParams, MonthlyExpenseParams } from '../metrics/metrics.service';

@Injectable()
export class BudgetsService {
  constructor(
    private databaseService: DatabaseService,
    private metricsService: MetricsService,
  ) {}

  private get collection() {
    return this.databaseService.getDb().collection<Budget>('budgets');
  }

  async create(userId: string, createBudgetDto: CreateBudgetDto): Promise<Budget> {
    const budget: Omit<Budget, '_id'> = {
      userId: new ObjectId(userId),
      name: createBudgetDto.name,
      description: createBudgetDto.description,
      startDate: new Date(createBudgetDto.startDate),
      isActive: createBudgetDto.isActive ?? true,
      startBalance: normalizePositiveNumber(createBudgetDto.startBalance),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await this.collection.insertOne(budget as Budget);
    return { ...budget, _id: result.insertedId };
  }

  async findAll(userId: string): Promise<Budget[]> {
    return this.collection.find({ userId: new ObjectId(userId) }).toArray();
  }

  async findOne(id: string, userId: string): Promise<Budget> {
    const budget = await this.collection.findOne({ 
      _id: new ObjectId(id),
      userId: new ObjectId(userId)
    });

    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    return budget;
  }

  async update(id: string, userId: string, updateBudgetDto: UpdateBudgetDto): Promise<Budget> {
    const updateData: any = {
      ...updateBudgetDto,
      updatedAt: new Date(),
    };
    // Only update startBalance if provided (not undefined)
    if (updateBudgetDto.startBalance !== undefined) {
      updateData.startBalance = normalizePositiveNumber(updateBudgetDto.startBalance);
    }

    // Convert date strings to Date objects if provided
    if (updateBudgetDto.startDate) {
      updateData.startDate = new Date(updateBudgetDto.startDate);
    }

    await this.collection.updateOne(
      { _id: new ObjectId(id), userId: new ObjectId(userId) },
      { $set: updateData }
    );

    return this.findOne(id, userId);
  }

  async remove(id: string, userId: string): Promise<void> {
    const result = await this.collection.deleteOne({ 
      _id: new ObjectId(id),
      userId: new ObjectId(userId)
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException('Budget not found');
    }
  }

  async findActiveByUserId(userId: string): Promise<Budget[]> {
    return this.collection.find({ 
      userId: new ObjectId(userId),
      isActive: true,
      startDate: { $lte: new Date() }
    }).toArray();
  }

  async getBudgetSummary(userId: string): Promise<any> {
    const budgets = await this.findActiveByUserId(userId);
    const summary = {
      totalBudgets: budgets.length,
      budgets: budgets.map(budget => ({
        _id: budget._id,
        name: budget.name,
        description: budget.description,
        startDate: budget.startDate,
        isActive: budget.isActive
      }))
    };
    return summary;
  }

  async getMetrics(id: string, metric?: string | string[]): Promise<any> {
    const budget = await this.collection.findOne({ _id: new ObjectId(id) });
    
    if (!budget) {
      throw new NotFoundException('Budget not found');
    }
    
    // Determine which metrics to calculate
    const requestedMetrics = metric ? (Array.isArray(metric) ? metric : [metric]) : ['totalBalance', 'monthlyIncomeMedian', 'monthlyExpenseMedian'];
    
    const result: Record<string, any> = {};
    
    // Only calculate requested metrics
    for (const metricName of requestedMetrics) {
      switch (metricName) {
        case 'totalBalance':
          const balanceParams: TotalBalanceParams = {
            _id: budget._id!,
            startBalance: budget.startBalance
          };
          result.totalBalance = await this.metricsService.calculateTotalBalance(balanceParams);
          break;
          
        case 'monthlyIncomeMedian':
          const incomeParams: MonthlyIncomeParams = {
            _id: budget._id!
          };
          result.monthlyIncomeMedian = await this.metricsService.calculateMonthlyIncomeMedian(incomeParams);
          break;
          
        case 'monthlyExpenseMedian':
          const expenseParams: MonthlyExpenseParams = {
            _id: budget._id!
          };
          result.monthlyExpenseMedian = await this.metricsService.calculateMonthlyExpenseMedian(expenseParams);
          break;
          
        // Ignore unknown metric names
        default:
          break;
      }
    }
    
    return result;
  }
}
