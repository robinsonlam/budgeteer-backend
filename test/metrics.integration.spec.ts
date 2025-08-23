import { MetricsService, TotalBalanceParams, MonthlyIncomeParams, MonthlyExpenseParams } from '../src/metrics/metrics.service';
import { MongoClient, ObjectId } from 'mongodb';
import { TransactionType } from '../src/common/enums';

describe('MetricsService (integration)', () => {
  let connection: MongoClient;
  let db: any;
  let metricsService: MetricsService;

  beforeAll(async () => {
    connection = await MongoClient.connect(global.__MONGO_URI__);
    db = await connection.db();
    
    // Create MetricsService with a mock DatabaseService
    const mockDatabaseService = {
      getDb: () => db
    };
    metricsService = new MetricsService(mockDatabaseService as any);
  });

  afterAll(async () => {
    await connection.close();
  });

  beforeEach(async () => {
    // Clean up collections before each test
    await db.collection('transactions').deleteMany({});
  });

  it('should calculate total balance with income and expense transactions', async () => {
    const budgetId = new ObjectId();
    await db.collection('transactions').insertMany([
      { budgetId, amount: 500, type: TransactionType.INCOME },
      { budgetId, amount: 150, type: TransactionType.EXPENSE },
      { budgetId, amount: 200, type: TransactionType.INCOME },
    ]);
    const budget: TotalBalanceParams = { _id: budgetId, startBalance: 50 };
    const total = await metricsService.calculateTotalBalance(budget);
    // 50 (startBalance) + 700 (income: 500+200) - 150 (expenses) = 600
    expect(total).toBe(600);
  });

  it('should return startBalance if no transactions', async () => {
    const budgetId = new ObjectId();
    const budget: TotalBalanceParams = { _id: budgetId, startBalance: 200 };
    const total = await metricsService.calculateTotalBalance(budget);
    expect(total).toBe(200);
  });

  // Monthly Income Median Integration Tests
  describe('calculateMonthlyIncomeMedian (integration)', () => {
    it('should calculate median income across multiple months', async () => {
      const budgetId = new ObjectId();
      
      // Insert transactions across 3 months
      await db.collection('transactions').insertMany([
        // January: $1000 total income
        { budgetId, amount: 600, type: TransactionType.INCOME, date: new Date('2024-01-15') },
        { budgetId, amount: 400, type: TransactionType.INCOME, date: new Date('2024-01-20') },
        
        // February: $2000 total income  
        { budgetId, amount: 1200, type: TransactionType.INCOME, date: new Date('2024-02-10') },
        { budgetId, amount: 800, type: TransactionType.INCOME, date: new Date('2024-02-25') },
        
        // March: $1500 total income
        { budgetId, amount: 900, type: TransactionType.INCOME, date: new Date('2024-03-05') },
        { budgetId, amount: 600, type: TransactionType.INCOME, date: new Date('2024-03-18') },
        
        // Add some expenses to verify they're filtered out
        { budgetId, amount: 300, type: TransactionType.EXPENSE, date: new Date('2024-01-10') },
        { budgetId, amount: 200, type: TransactionType.EXPENSE, date: new Date('2024-02-15') },
      ]);
      
      const budget: MonthlyIncomeParams = { _id: budgetId };
      const median = await metricsService.calculateMonthlyIncomeMedian(budget);
      
      // Monthly incomes: [1000, 1500, 2000] (sorted)
      // Median of odd number = middle value = 1500
      expect(median).toBe(1500);
    });

    it('should calculate median for even number of months', async () => {
      const budgetId = new ObjectId();
      
      // Insert transactions across 4 months
      await db.collection('transactions').insertMany([
        // January: $1000
        { budgetId, amount: 1000, type: TransactionType.INCOME, date: new Date('2024-01-15') },
        
        // February: $2000
        { budgetId, amount: 2000, type: TransactionType.INCOME, date: new Date('2024-02-15') },
        
        // March: $3000
        { budgetId, amount: 3000, type: TransactionType.INCOME, date: new Date('2024-03-15') },
        
        // April: $4000
        { budgetId, amount: 4000, type: TransactionType.INCOME, date: new Date('2024-04-15') },
      ]);
      
      const budget: MonthlyIncomeParams = { _id: budgetId };
      const median = await metricsService.calculateMonthlyIncomeMedian(budget);
      
      // Monthly incomes: [1000, 2000, 3000, 4000] (sorted)
      // Median of even number = (2000 + 3000) / 2 = 2500
      expect(median).toBe(2500);
    });

    it('should return 0 when no income transactions exist', async () => {
      const budgetId = new ObjectId();
      
      // Insert only expense transactions
      await db.collection('transactions').insertMany([
        { budgetId, amount: 500, type: TransactionType.EXPENSE, date: new Date('2024-01-15') },
        { budgetId, amount: 300, type: TransactionType.EXPENSE, date: new Date('2024-02-15') },
      ]);
      
      const budget: MonthlyIncomeParams = { _id: budgetId };
      const median = await metricsService.calculateMonthlyIncomeMedian(budget);
      expect(median).toBe(0);
    });

    it('should handle single month correctly', async () => {
      const budgetId = new ObjectId();
      
      // Insert income transactions for only one month
      await db.collection('transactions').insertMany([
        { budgetId, amount: 800, type: TransactionType.INCOME, date: new Date('2024-01-10') },
        { budgetId, amount: 700, type: TransactionType.INCOME, date: new Date('2024-01-20') },
      ]);
      
      const budget: MonthlyIncomeParams = { _id: budgetId };
      const median = await metricsService.calculateMonthlyIncomeMedian(budget);
      
      // Only one month with total income = 800 + 700 = 1500
      expect(median).toBe(1500);
    });

    it('should only include transactions from the specified budget', async () => {
      const budgetId1 = new ObjectId();
      const budgetId2 = new ObjectId();
      
      await db.collection('transactions').insertMany([
        // Budget 1: January $1000, February $2000
        { budgetId: budgetId1, amount: 1000, type: TransactionType.INCOME, date: new Date('2024-01-15') },
        { budgetId: budgetId1, amount: 2000, type: TransactionType.INCOME, date: new Date('2024-02-15') },
        
        // Budget 2: January $5000 (should not affect budget 1 calculation)
        { budgetId: budgetId2, amount: 5000, type: TransactionType.INCOME, date: new Date('2024-01-15') },
      ]);
      
      const budget1: MonthlyIncomeParams = { _id: budgetId1 };
      const median1 = await metricsService.calculateMonthlyIncomeMedian(budget1);
      
      // Budget 1 median: [1000, 2000] = (1000 + 2000) / 2 = 1500
      expect(median1).toBe(1500);
    });
  });

  // Monthly Expense Median Integration Tests
  describe('calculateMonthlyExpenseMedian (integration)', () => {
    it('should calculate median expense across multiple months', async () => {
      const budgetId = new ObjectId();
      
      // Insert transactions across 3 months
      await db.collection('transactions').insertMany([
        // January: $800 total expense
        { budgetId, amount: 500, type: TransactionType.EXPENSE, date: new Date('2024-01-15') },
        { budgetId, amount: 300, type: TransactionType.EXPENSE, date: new Date('2024-01-20') },
        
        // February: $1200 total expense  
        { budgetId, amount: 700, type: TransactionType.EXPENSE, date: new Date('2024-02-10') },
        { budgetId, amount: 500, type: TransactionType.EXPENSE, date: new Date('2024-02-25') },
        
        // March: $900 total expense
        { budgetId, amount: 400, type: TransactionType.EXPENSE, date: new Date('2024-03-05') },
        { budgetId, amount: 500, type: TransactionType.EXPENSE, date: new Date('2024-03-18') },
        
        // Add some income to verify they're filtered out
        { budgetId, amount: 2000, type: TransactionType.INCOME, date: new Date('2024-01-10') },
        { budgetId, amount: 1500, type: TransactionType.INCOME, date: new Date('2024-02-15') },
      ]);
      
      const budget: MonthlyExpenseParams = { _id: budgetId };
      const median = await metricsService.calculateMonthlyExpenseMedian(budget);
      
      // Monthly expenses: [800, 900, 1200] (sorted)
      // Median of odd number = middle value = 900
      expect(median).toBe(900);
    });

    it('should calculate median for even number of months', async () => {
      const budgetId = new ObjectId();
      
      // Insert transactions across 4 months
      await db.collection('transactions').insertMany([
        // January: $600
        { budgetId, amount: 600, type: TransactionType.EXPENSE, date: new Date('2024-01-15') },
        
        // February: $800
        { budgetId, amount: 800, type: TransactionType.EXPENSE, date: new Date('2024-02-15') },
        
        // March: $1000
        { budgetId, amount: 1000, type: TransactionType.EXPENSE, date: new Date('2024-03-15') },
        
        // April: $1400
        { budgetId, amount: 1400, type: TransactionType.EXPENSE, date: new Date('2024-04-15') },
      ]);
      
      const budget: MonthlyExpenseParams = { _id: budgetId };
      const median = await metricsService.calculateMonthlyExpenseMedian(budget);
      
      // Monthly expenses: [600, 800, 1000, 1400] (sorted)
      // Median of even number = (800 + 1000) / 2 = 900
      expect(median).toBe(900);
    });

    it('should return 0 when no expense transactions exist', async () => {
      const budgetId = new ObjectId();
      
      // Insert only income transactions
      await db.collection('transactions').insertMany([
        { budgetId, amount: 2000, type: TransactionType.INCOME, date: new Date('2024-01-15') },
        { budgetId, amount: 1800, type: TransactionType.INCOME, date: new Date('2024-02-15') },
      ]);
      
      const budget: MonthlyExpenseParams = { _id: budgetId };
      const median = await metricsService.calculateMonthlyExpenseMedian(budget);
      expect(median).toBe(0);
    });

    it('should handle single month correctly', async () => {
      const budgetId = new ObjectId();
      
      // Insert expense transactions for only one month
      await db.collection('transactions').insertMany([
        { budgetId, amount: 400, type: TransactionType.EXPENSE, date: new Date('2024-01-10') },
        { budgetId, amount: 350, type: TransactionType.EXPENSE, date: new Date('2024-01-20') },
      ]);
      
      const budget: MonthlyExpenseParams = { _id: budgetId };
      const median = await metricsService.calculateMonthlyExpenseMedian(budget);
      
      // Only one month with total expense = 400 + 350 = 750
      expect(median).toBe(750);
    });

    it('should only include transactions from the specified budget', async () => {
      const budgetId1 = new ObjectId();
      const budgetId2 = new ObjectId();
      
      await db.collection('transactions').insertMany([
        // Budget 1: January $600, February $800
        { budgetId: budgetId1, amount: 600, type: TransactionType.EXPENSE, date: new Date('2024-01-15') },
        { budgetId: budgetId1, amount: 800, type: TransactionType.EXPENSE, date: new Date('2024-02-15') },
        
        // Budget 2: January $2000 (should not affect budget 1 calculation)
        { budgetId: budgetId2, amount: 2000, type: TransactionType.EXPENSE, date: new Date('2024-01-15') },
      ]);
      
      const budget1: MonthlyExpenseParams = { _id: budgetId1 };
      const median1 = await metricsService.calculateMonthlyExpenseMedian(budget1);
      
      // Budget 1 median: [600, 800] = (600 + 800) / 2 = 700
      expect(median1).toBe(700);
    });
  });
});
