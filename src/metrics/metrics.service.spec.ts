import { Test, TestingModule } from '@nestjs/testing';
import { MetricsService, TotalBalanceParams } from './metrics.service';
import { DatabaseService } from '../database/database.service';
import { ObjectId } from 'mongodb';

describe('MetricsService', () => {
  let metricsService: MetricsService;
  let mockDbService: any;

  beforeEach(() => {
    mockDbService = {
      getDb: jest.fn().mockReturnValue({
        collection: jest.fn().mockReturnValue({
          aggregate: jest.fn().mockReturnValue({
            toArray: jest.fn()
          })
        })
      })
    };
    metricsService = new MetricsService(mockDbService);
  });

  it('should return startBalance if there are no transactions', async () => {
    const budget: TotalBalanceParams = { 
      _id: new ObjectId('507f1f77bcf86cd799439011'), 
      startBalance: 100 
    };
    mockDbService.getDb().collection().aggregate().toArray.mockResolvedValue([]);
    const result = await metricsService.calculateTotalBalance(budget);
    expect(result).toBe(100);
  });

  it('should add transaction total to startBalance', async () => {
    const budget: TotalBalanceParams = { 
      _id: new ObjectId('507f1f77bcf86cd799439012'), 
      startBalance: 50 
    };
    mockDbService.getDb().collection().aggregate().toArray.mockResolvedValue([{ total: 200 }]);
    const result = await metricsService.calculateTotalBalance(budget);
    expect(result).toBe(250);
  });

  it('should treat missing startBalance as 0', async () => {
    const budget: TotalBalanceParams = { 
      _id: new ObjectId('507f1f77bcf86cd799439013') 
    };
    mockDbService.getDb().collection().aggregate().toArray.mockResolvedValue([{ total: 10 }]);
    const result = await metricsService.calculateTotalBalance(budget);
    expect(result).toBe(10);
  });

  it('should generate correct aggregation query for budget transactions', async () => {
    const budgetId = new ObjectId('507f1f77bcf86cd799439014');
    const budget: TotalBalanceParams = { 
      _id: budgetId, 
      startBalance: 100 
    };
    const mockAggregate = mockDbService.getDb().collection().aggregate;
    mockAggregate().toArray.mockResolvedValue([{ total: 50 }]);
    
    await metricsService.calculateTotalBalance(budget);
    
    expect(mockAggregate).toHaveBeenCalledWith([
      { $match: { budgetId: budgetId } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
  });
});
