import { MetricsService, TotalBalanceParams } from '../src/metrics/metrics.service';
import { MongoClient, ObjectId } from 'mongodb';

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

  it('should calculate total balance with transactions', async () => {
    const budgetId = new ObjectId();
    await db.collection('transactions').insertMany([
      { budgetId, amount: 100 },
      { budgetId, amount: -20 },
    ]);
    const budget: TotalBalanceParams = { _id: budgetId, startBalance: 50 };
    const total = await metricsService.calculateTotalBalance(budget);
    expect(total).toBe(130); // 50 + 100 - 20
  });

  it('should return startBalance if no transactions', async () => {
    const budgetId = new ObjectId();
    const budget: TotalBalanceParams = { _id: budgetId, startBalance: 200 };
    const total = await metricsService.calculateTotalBalance(budget);
    expect(total).toBe(200);
  });
});
