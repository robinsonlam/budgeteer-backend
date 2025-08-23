import { MetricsService, TotalBalanceParams, MonthlyIncomeParams, MonthlyExpenseParams, TotalIncomeParams, TotalExpensesParams, NetAmountParams } from './metrics.service';
import { ObjectId } from 'mongodb';
import { TransactionType } from '../common/enums';

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
    mockDbService.getDb().collection().aggregate().toArray.mockResolvedValue([]);

    const budget: TotalBalanceParams = { 
      _id: new ObjectId(), 
      startBalance: 100 
    };

    const result = await metricsService.calculateTotalBalance(budget);
    expect(result).toBe(100);
  });

  it('should calculate balance with income and expenses correctly', async () => {
    const budget: TotalBalanceParams = { 
      _id: new ObjectId('507f1f77bcf86cd799439012'), 
      startBalance: 50 
    };
    
    // Mock result: $300 income, $100 expenses
    mockDbService.getDb().collection().aggregate().toArray.mockResolvedValue([
      { totalIncome: 300, totalExpenses: 100 }
    ]);
    
    const result = await metricsService.calculateTotalBalance(budget);
    // 50 (startBalance) + 300 (income) - 100 (expenses) = 250
    expect(result).toBe(250);
  });

  it('should treat missing startBalance as 0', async () => {
    const budget: TotalBalanceParams = { 
      _id: new ObjectId('507f1f77bcf86cd799439013') 
    };
    
    mockDbService.getDb().collection().aggregate().toArray.mockResolvedValue([
      { totalIncome: 150, totalExpenses: 50 }
    ]);
    
    const result = await metricsService.calculateTotalBalance(budget);
    // 0 (default startBalance) + 150 (income) - 50 (expenses) = 100
    expect(result).toBe(100);
  });

  it('should generate correct aggregation query for budget transactions', async () => {
    const budgetId = new ObjectId('507f1f77bcf86cd799439014');
    const budget: TotalBalanceParams = { 
      _id: budgetId, 
      startBalance: 100 
    };
    const mockAggregate = mockDbService.getDb().collection().aggregate;
    mockAggregate().toArray.mockResolvedValue([{ totalIncome: 200, totalExpenses: 50 }]);
    
    await metricsService.calculateTotalBalance(budget);
    
    expect(mockAggregate).toHaveBeenCalledWith([
      { $match: { budgetId: budgetId } },
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
    ]);
  });

  // Monthly Income Median Tests
  describe('calculateMonthlyIncomeMedian', () => {
    it('should return 0 if there are no income transactions', async () => {
      mockDbService.getDb().collection().aggregate().toArray.mockResolvedValue([]);

      const budget: MonthlyIncomeParams = { 
        _id: new ObjectId() 
      };

      const result = await metricsService.calculateMonthlyIncomeMedian(budget);
      expect(result).toBe(0);
    });

    it('should calculate median for odd number of months', async () => {
      const budget: MonthlyIncomeParams = { 
        _id: new ObjectId('507f1f77bcf86cd799439015') 
      };
      
      // Mock result: 3 months with incomes $100, $200, $300
      mockDbService.getDb().collection().aggregate().toArray.mockResolvedValue([
        { _id: '2024-01', monthlyIncome: 100 },
        { _id: '2024-02', monthlyIncome: 200 },
        { _id: '2024-03', monthlyIncome: 300 }
      ]);
      
      const result = await metricsService.calculateMonthlyIncomeMedian(budget);
      // Median of [100, 200, 300] = 200
      expect(result).toBe(200);
    });

    it('should calculate median for even number of months', async () => {
      const budget: MonthlyIncomeParams = { 
        _id: new ObjectId('507f1f77bcf86cd799439016') 
      };
      
      // Mock result: 4 months with incomes $100, $200, $300, $400
      mockDbService.getDb().collection().aggregate().toArray.mockResolvedValue([
        { _id: '2024-01', monthlyIncome: 100 },
        { _id: '2024-02', monthlyIncome: 200 },
        { _id: '2024-03', monthlyIncome: 300 },
        { _id: '2024-04', monthlyIncome: 400 }
      ]);
      
      const result = await metricsService.calculateMonthlyIncomeMedian(budget);
      // Median of [100, 200, 300, 400] = (200 + 300) / 2 = 250
      expect(result).toBe(250);
    });

    it('should handle single month correctly', async () => {
      const budget: MonthlyIncomeParams = { 
        _id: new ObjectId('507f1f77bcf86cd799439017') 
      };
      
      // Mock result: 1 month with income $500
      mockDbService.getDb().collection().aggregate().toArray.mockResolvedValue([
        { _id: '2024-01', monthlyIncome: 500 }
      ]);
      
      const result = await metricsService.calculateMonthlyIncomeMedian(budget);
      expect(result).toBe(500);
    });

    it('should generate correct aggregation query for monthly income', async () => {
      const budgetId = new ObjectId('507f1f77bcf86cd799439018');
      const budget: MonthlyIncomeParams = { 
        _id: budgetId 
      };
      const mockAggregate = mockDbService.getDb().collection().aggregate;
      mockAggregate().toArray.mockResolvedValue([
        { _id: '2024-01', monthlyIncome: 1000 }
      ]);
      
      await metricsService.calculateMonthlyIncomeMedian(budget);
      
      expect(mockAggregate).toHaveBeenCalledWith([
        { 
          $match: { 
            budgetId: budgetId,
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
      ]);
    });
  });

  // Monthly Expense Median Tests
  describe('calculateMonthlyExpenseMedian', () => {
    it('should return 0 if there are no expense transactions', async () => {
      mockDbService.getDb().collection().aggregate().toArray.mockResolvedValue([]);

      const budget: MonthlyExpenseParams = { 
        _id: new ObjectId() 
      };

      const result = await metricsService.calculateMonthlyExpenseMedian(budget);
      expect(result).toBe(0);
    });

    it('should calculate median for odd number of months', async () => {
      const budget: MonthlyExpenseParams = { 
        _id: new ObjectId('507f1f77bcf86cd799439019') 
      };
      
      // Mock result: 3 months with expenses $500, $800, $1200
      mockDbService.getDb().collection().aggregate().toArray.mockResolvedValue([
        { _id: '2024-01', monthlyExpense: 500 },
        { _id: '2024-02', monthlyExpense: 800 },
        { _id: '2024-03', monthlyExpense: 1200 }
      ]);
      
      const result = await metricsService.calculateMonthlyExpenseMedian(budget);
      // Median of [500, 800, 1200] = 800
      expect(result).toBe(800);
    });

    it('should calculate median for even number of months', async () => {
      const budget: MonthlyExpenseParams = { 
        _id: new ObjectId('507f1f77bcf86cd799439020') 
      };
      
      // Mock result: 4 months with expenses $600, $800, $1000, $1400
      mockDbService.getDb().collection().aggregate().toArray.mockResolvedValue([
        { _id: '2024-01', monthlyExpense: 600 },
        { _id: '2024-02', monthlyExpense: 800 },
        { _id: '2024-03', monthlyExpense: 1000 },
        { _id: '2024-04', monthlyExpense: 1400 }
      ]);
      
      const result = await metricsService.calculateMonthlyExpenseMedian(budget);
      // Median of [600, 800, 1000, 1400] = (800 + 1000) / 2 = 900
      expect(result).toBe(900);
    });

    it('should handle single month correctly', async () => {
      const budget: MonthlyExpenseParams = { 
        _id: new ObjectId('507f1f77bcf86cd799439021') 
      };
      
      // Mock result: 1 month with expense $750
      mockDbService.getDb().collection().aggregate().toArray.mockResolvedValue([
        { _id: '2024-01', monthlyExpense: 750 }
      ]);
      
      const result = await metricsService.calculateMonthlyExpenseMedian(budget);
      expect(result).toBe(750);
    });

    it('should generate correct aggregation query for monthly expenses', async () => {
      const budgetId = new ObjectId('507f1f77bcf86cd799439022');
      const budget: MonthlyExpenseParams = { 
        _id: budgetId 
      };
      const mockAggregate = mockDbService.getDb().collection().aggregate;
      mockAggregate().toArray.mockResolvedValue([
        { _id: '2024-01', monthlyExpense: 1200 }
      ]);
      
      await metricsService.calculateMonthlyExpenseMedian(budget);
      
      expect(mockAggregate).toHaveBeenCalledWith([
        { 
          $match: { 
            budgetId: budgetId,
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
      ]);
    });
  });

  describe('calculateTotalIncome', () => {
    it('should return 0 when no income transactions exist', async () => {
      mockDbService.getDb().collection().aggregate().toArray.mockResolvedValue([]);
      
      const budget: TotalIncomeParams = { _id: new ObjectId() };
      const result = await metricsService.calculateTotalIncome(budget);
      
      expect(result).toBe(0);
    });

    it('should calculate total income correctly', async () => {
      mockDbService.getDb().collection().aggregate().toArray.mockResolvedValue([
        { totalIncome: 1500 }
      ]);
      
      const budget: TotalIncomeParams = { _id: new ObjectId() };
      const result = await metricsService.calculateTotalIncome(budget);
      
      expect(result).toBe(1500);
    });
  });

  describe('calculateTotalExpenses', () => {
    it('should return 0 when no expense transactions exist', async () => {
      mockDbService.getDb().collection().aggregate().toArray.mockResolvedValue([]);
      
      const budget: TotalExpensesParams = { _id: new ObjectId() };
      const result = await metricsService.calculateTotalExpenses(budget);
      
      expect(result).toBe(0);
    });

    it('should calculate total expenses correctly', async () => {
      mockDbService.getDb().collection().aggregate().toArray.mockResolvedValue([
        { totalExpenses: 800 }
      ]);
      
      const budget: TotalExpensesParams = { _id: new ObjectId() };
      const result = await metricsService.calculateTotalExpenses(budget);
      
      expect(result).toBe(800);
    });
  });

  describe('calculateNetAmount', () => {
    it('should calculate net amount correctly', async () => {
      // Mock the individual methods instead of direct aggregation calls
      jest.spyOn(metricsService, 'calculateTotalIncome').mockResolvedValue(1500);
      jest.spyOn(metricsService, 'calculateTotalExpenses').mockResolvedValue(800);
      
      const budget: NetAmountParams = { _id: new ObjectId() };
      const result = await metricsService.calculateNetAmount(budget);
      
      expect(result).toBe(700); // 1500 - 800
    });

    it('should handle negative net amount', async () => {
      jest.spyOn(metricsService, 'calculateTotalIncome').mockResolvedValue(500);
      jest.spyOn(metricsService, 'calculateTotalExpenses').mockResolvedValue(800);
      
      const budget: NetAmountParams = { _id: new ObjectId() };
      const result = await metricsService.calculateNetAmount(budget);
      
      expect(result).toBe(-300); // 500 - 800
    });
  });
});
