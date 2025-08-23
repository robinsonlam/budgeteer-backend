import { Test, TestingModule } from '@nestjs/testing';
import { BudgetsController } from '../src/budgets/budgets.controller';
import { BudgetsService } from '../src/budgets/budgets.service';
import { MetricsService } from '../src/metrics/metrics.service';
import { ProjectionsService } from '../src/projections/projections.service';
import { DatabaseService } from '../src/database/database.service';
import { MongoClient, ObjectId } from 'mongodb';
import { Budget } from '../src/budgets/interfaces/budget.interface';

describe('BudgetsController Metrics Integration', () => {
  let controller: BudgetsController;
  let budgetsService: BudgetsService;
  let metricsService: MetricsService;
  let connection: MongoClient;
  let db: any;

  beforeAll(async () => {
    connection = await MongoClient.connect(global.__MONGO_URI__);
    db = await connection.db();
    
    const mockDatabaseService = {
      getDb: () => db
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BudgetsController],
      providers: [
        BudgetsService,
        MetricsService,
        ProjectionsService,
        { provide: DatabaseService, useValue: mockDatabaseService },
      ],
    }).compile();

    controller = module.get<BudgetsController>(BudgetsController);
    budgetsService = module.get<BudgetsService>(BudgetsService);
    metricsService = module.get<MetricsService>(MetricsService);
  });

  afterAll(async () => {
    await connection.close();
  });

  beforeEach(async () => {
    // Clean up collections before each test
    await db.collection('budgets').deleteMany({});
    await db.collection('transactions').deleteMany({});
  });

  it('should only call requested metric calculations', async () => {
    // Create a test budget
    const userId = new ObjectId();
    const budget: Omit<Budget, '_id'> = {
      userId,
      name: 'Test Budget',
      description: 'Test Description',
      startDate: new Date('2024-01-01'),
      isActive: true,
      startBalance: 1000,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const insertResult = await db.collection('budgets').insertOne(budget);
    const budgetId = insertResult.insertedId;

    // Spy on metrics service methods
    const totalBalanceSpy = jest.spyOn(metricsService, 'calculateTotalBalance');
    const incomeMedianSpy = jest.spyOn(metricsService, 'calculateMonthlyIncomeMedian');
    const expenseMedianSpy = jest.spyOn(metricsService, 'calculateMonthlyExpenseMedian');

    // Test single metric request
    const req = { user: { userId: userId.toString() } };
    await controller.getMetrics(budgetId.toString(), req, 'totalBalance');

    expect(totalBalanceSpy).toHaveBeenCalledTimes(1);
    expect(incomeMedianSpy).not.toHaveBeenCalled();
    expect(expenseMedianSpy).not.toHaveBeenCalled();

    // Reset spies
    totalBalanceSpy.mockClear();
    incomeMedianSpy.mockClear();
    expenseMedianSpy.mockClear();

    // Test multiple metrics request
    await controller.getMetrics(budgetId.toString(), req, ['totalBalance', 'monthlyIncomeMedian']);

    expect(totalBalanceSpy).toHaveBeenCalledTimes(1);
    expect(incomeMedianSpy).toHaveBeenCalledTimes(1);
    expect(expenseMedianSpy).not.toHaveBeenCalled();

    // Cleanup spies
    totalBalanceSpy.mockRestore();
    incomeMedianSpy.mockRestore();
    expenseMedianSpy.mockRestore();
  });

  it('should handle query parameter variations correctly', async () => {
    // Create a test budget
    const userId = new ObjectId();
    const budget: Omit<Budget, '_id'> = {
      userId,
      name: 'Test Budget',
      description: 'Test Description', 
      startDate: new Date('2024-01-01'),
      isActive: true,
      startBalance: 1000,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const insertResult = await db.collection('budgets').insertOne(budget);
    const budgetId = insertResult.insertedId;

    const req = { user: { userId: userId.toString() } };

    // Test with no metrics (should return all)
    const allMetrics = await controller.getMetrics(budgetId.toString(), req);
    expect(allMetrics).toHaveProperty('totalBalance');
    expect(allMetrics).toHaveProperty('monthlyIncomeMedian'); 
    expect(allMetrics).toHaveProperty('monthlyExpenseMedian');
    expect(allMetrics).toHaveProperty('projectedYearEndBalance');

    // Test with single metric as string
    const singleMetric = await controller.getMetrics(budgetId.toString(), req, 'totalBalance');
    expect(singleMetric).toHaveProperty('totalBalance');
    expect(singleMetric).not.toHaveProperty('monthlyIncomeMedian');
    expect(singleMetric).not.toHaveProperty('monthlyExpenseMedian');
    expect(singleMetric).not.toHaveProperty('projectedYearEndBalance');

    // Test with multiple metrics as array
    const multipleMetrics = await controller.getMetrics(budgetId.toString(), req, ['totalBalance', 'monthlyIncomeMedian']);
    expect(multipleMetrics).toHaveProperty('totalBalance');
    expect(multipleMetrics).toHaveProperty('monthlyIncomeMedian');
    expect(multipleMetrics).not.toHaveProperty('monthlyExpenseMedian');
    expect(multipleMetrics).not.toHaveProperty('projectedYearEndBalance');

    // Test with projected year-end balance specifically
    const projectedMetric = await controller.getMetrics(budgetId.toString(), req, 'projectedYearEndBalance');
    expect(projectedMetric).toHaveProperty('projectedYearEndBalance');
    expect(projectedMetric).not.toHaveProperty('totalBalance');
    expect(projectedMetric).not.toHaveProperty('monthlyIncomeMedian');
    expect(projectedMetric).not.toHaveProperty('monthlyExpenseMedian');
  });
});
