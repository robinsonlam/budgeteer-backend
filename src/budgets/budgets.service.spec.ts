import { Test, TestingModule } from '@nestjs/testing';
import { BudgetsService } from './budgets.service';
import { DatabaseService } from '../database/database.service';
import { MetricsService } from '../metrics/metrics.service';
import { ObjectId } from 'mongodb';
import { Budget } from './interfaces/budget.interface';

describe('BudgetsService', () => {
  let budgetsService: BudgetsService;
  let mockDbService: any;
  let mockMetricsService: any;

  beforeEach(async () => {
    mockDbService = {
      getDb: jest.fn().mockReturnValue({
        collection: jest.fn().mockReturnValue({
          findOne: jest.fn(),
          find: jest.fn(),
          insertOne: jest.fn(),
          updateOne: jest.fn(),
          deleteOne: jest.fn(),
        })
      })
    };

    mockMetricsService = {
      calculateTotalBalance: jest.fn(),
      calculateMonthlyIncomeMedian: jest.fn(),
      calculateMonthlyExpenseMedian: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetsService,
        { provide: DatabaseService, useValue: mockDbService },
        { provide: MetricsService, useValue: mockMetricsService },
      ],
    }).compile();

    budgetsService = module.get<BudgetsService>(BudgetsService);
  });

  describe('getMetrics', () => {
    const mockBudget: Budget = {
      _id: new ObjectId('507f1f77bcf86cd799439011'),
      userId: new ObjectId('507f1f77bcf86cd799439012'),
      name: 'Test Budget',
      description: 'Test Description',
      startDate: new Date('2024-01-01'),
      isActive: true,
      startBalance: 1000,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    beforeEach(() => {
      mockDbService.getDb().collection().findOne.mockResolvedValue(mockBudget);
      mockMetricsService.calculateTotalBalance.mockResolvedValue(5000);
      mockMetricsService.calculateMonthlyIncomeMedian.mockResolvedValue(3000);
      mockMetricsService.calculateMonthlyExpenseMedian.mockResolvedValue(2000);
    });

    it('should only calculate totalBalance when requested', async () => {
      const result = await budgetsService.getMetrics('507f1f77bcf86cd799439011', 'totalBalance');

      expect(mockMetricsService.calculateTotalBalance).toHaveBeenCalledTimes(1);
      expect(mockMetricsService.calculateMonthlyIncomeMedian).not.toHaveBeenCalled();
      expect(mockMetricsService.calculateMonthlyExpenseMedian).not.toHaveBeenCalled();
      expect(result).toEqual({ totalBalance: 5000 });
    });

    it('should only calculate monthlyIncomeMedian when requested', async () => {
      const result = await budgetsService.getMetrics('507f1f77bcf86cd799439011', 'monthlyIncomeMedian');

      expect(mockMetricsService.calculateTotalBalance).not.toHaveBeenCalled();
      expect(mockMetricsService.calculateMonthlyIncomeMedian).toHaveBeenCalledTimes(1);
      expect(mockMetricsService.calculateMonthlyExpenseMedian).not.toHaveBeenCalled();
      expect(result).toEqual({ monthlyIncomeMedian: 3000 });
    });

    it('should only calculate monthlyExpenseMedian when requested', async () => {
      const result = await budgetsService.getMetrics('507f1f77bcf86cd799439011', 'monthlyExpenseMedian');

      expect(mockMetricsService.calculateTotalBalance).not.toHaveBeenCalled();
      expect(mockMetricsService.calculateMonthlyIncomeMedian).not.toHaveBeenCalled();
      expect(mockMetricsService.calculateMonthlyExpenseMedian).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ monthlyExpenseMedian: 2000 });
    });

    it('should calculate multiple metrics when array is provided', async () => {
      const result = await budgetsService.getMetrics('507f1f77bcf86cd799439011', ['totalBalance', 'monthlyIncomeMedian']);

      expect(mockMetricsService.calculateTotalBalance).toHaveBeenCalledTimes(1);
      expect(mockMetricsService.calculateMonthlyIncomeMedian).toHaveBeenCalledTimes(1);
      expect(mockMetricsService.calculateMonthlyExpenseMedian).not.toHaveBeenCalled();
      expect(result).toEqual({ 
        totalBalance: 5000,
        monthlyIncomeMedian: 3000
      });
    });

    it('should calculate all metrics when no specific metrics requested', async () => {
      const result = await budgetsService.getMetrics('507f1f77bcf86cd799439011');

      expect(mockMetricsService.calculateTotalBalance).toHaveBeenCalledTimes(1);
      expect(mockMetricsService.calculateMonthlyIncomeMedian).toHaveBeenCalledTimes(1);
      expect(mockMetricsService.calculateMonthlyExpenseMedian).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ 
        totalBalance: 5000,
        monthlyIncomeMedian: 3000,
        monthlyExpenseMedian: 2000
      });
    });

    it('should ignore unknown metric names and only calculate known ones', async () => {
      const result = await budgetsService.getMetrics('507f1f77bcf86cd799439011', ['totalBalance', 'unknownMetric']);

      expect(mockMetricsService.calculateTotalBalance).toHaveBeenCalledTimes(1);
      expect(mockMetricsService.calculateMonthlyIncomeMedian).not.toHaveBeenCalled();
      expect(mockMetricsService.calculateMonthlyExpenseMedian).not.toHaveBeenCalled();
      expect(result).toEqual({ totalBalance: 5000 });
    });

    it('should return empty object when only unknown metrics are requested', async () => {
      const result = await budgetsService.getMetrics('507f1f77bcf86cd799439011', ['unknownMetric1', 'unknownMetric2']);

      expect(mockMetricsService.calculateTotalBalance).not.toHaveBeenCalled();
      expect(mockMetricsService.calculateMonthlyIncomeMedian).not.toHaveBeenCalled();
      expect(mockMetricsService.calculateMonthlyExpenseMedian).not.toHaveBeenCalled();
      expect(result).toEqual({});
    });
  });
});
