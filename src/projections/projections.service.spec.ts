import { Test, TestingModule } from '@nestjs/testing';
import { ProjectionsService, ProjectedYearEndBalanceParams } from './projections.service';
import { MetricsService } from '../metrics/metrics.service';
import { ObjectId } from 'mongodb';

describe('ProjectionsService', () => {
  let projectionsService: ProjectionsService;
  let mockMetricsService: any;

  beforeEach(async () => {
    mockMetricsService = {
      calculateTotalBalance: jest.fn(),
      calculateMonthlyIncomeMedian: jest.fn(),
      calculateMonthlyExpenseMedian: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectionsService,
        { provide: MetricsService, useValue: mockMetricsService },
      ],
    }).compile();

    projectionsService = module.get<ProjectionsService>(ProjectionsService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('calculateProjectedYearEndBalance', () => {
    beforeEach(() => {
      // Mock the other metric calculations
      mockMetricsService.calculateTotalBalance.mockResolvedValue(5000);
      mockMetricsService.calculateMonthlyIncomeMedian.mockResolvedValue(3000);
      mockMetricsService.calculateMonthlyExpenseMedian.mockResolvedValue(2000);
    });

    it('should calculate projected year-end balance correctly for mid-year', async () => {
      const budget: ProjectedYearEndBalanceParams = { 
        _id: new ObjectId('507f1f77bcf86cd799439023'),
        startBalance: 1000,
        currentDate: new Date('2025-08-15') // August, so 4 months remaining
      };
      
      const result = await projectionsService.calculateProjectedYearEndBalance(budget);
      
      // Current balance: 5000, Monthly net flow: 3000 - 2000 = 1000, Remaining months: 4
      // Projected: 5000 + (1000 * 4) = 9000
      expect(result).toBe(9000);
    });

    it('should return current balance when in December', async () => {
      const budget: ProjectedYearEndBalanceParams = { 
        _id: new ObjectId('507f1f77bcf86cd799439024'),
        startBalance: 1000,
        currentDate: new Date('2025-12-15') // December, so 0 months remaining
      };
      
      const result = await projectionsService.calculateProjectedYearEndBalance(budget);
      
      // Should return current balance since no projection is needed
      expect(result).toBe(5000);
    });

    it('should handle negative monthly net flow correctly', async () => {
      mockMetricsService.calculateMonthlyIncomeMedian.mockResolvedValue(1500);
      mockMetricsService.calculateMonthlyExpenseMedian.mockResolvedValue(2500);
      
      const budget: ProjectedYearEndBalanceParams = { 
        _id: new ObjectId('507f1f77bcf86cd799439026'),
        startBalance: 1000,
        currentDate: new Date('2025-06-15') // June, so 6 months remaining
      };
      
      const result = await projectionsService.calculateProjectedYearEndBalance(budget);
      
      // Current balance: 5000, Monthly net flow: 1500 - 2500 = -1000, Remaining months: 6
      // Projected: 5000 + (-1000 * 6) = -1000
      expect(result).toBe(-1000);
    });

    it('should use current date when not provided', async () => {
      const budget: ProjectedYearEndBalanceParams = { 
        _id: new ObjectId('507f1f77bcf86cd799439027'),
        startBalance: 1000
        // No currentDate provided, should use new Date()
      };
      
      const result = await projectionsService.calculateProjectedYearEndBalance(budget);
      
      // Since we're in August 2025 (current date is 23 August 2025), should have 4 months remaining
      // Current balance: 5000, Monthly net flow: 3000 - 2000 = 1000, Remaining months: 4
      // Projected: 5000 + (1000 * 4) = 9000
      expect(result).toBe(9000);
    });

    it('should handle January correctly (11 months remaining)', async () => {
      const budget: ProjectedYearEndBalanceParams = { 
        _id: new ObjectId('507f1f77bcf86cd799439028'),
        startBalance: 1000,
        currentDate: new Date('2025-01-15') // January, so 11 months remaining
      };
      
      const result = await projectionsService.calculateProjectedYearEndBalance(budget);
      
      // Current balance: 5000, Monthly net flow: 3000 - 2000 = 1000, Remaining months: 11
      // Projected: 5000 + (1000 * 11) = 16000
      expect(result).toBe(16000);
    });

    it('should call dependent methods with correct parameters', async () => {
      const budgetId = new ObjectId('507f1f77bcf86cd799439029');
      const budget: ProjectedYearEndBalanceParams = { 
        _id: budgetId,
        startBalance: 1500,
        currentDate: new Date('2025-08-15')
      };
      
      await projectionsService.calculateProjectedYearEndBalance(budget);
      
      expect(mockMetricsService.calculateTotalBalance).toHaveBeenCalledWith({
        _id: budgetId,
        startBalance: 1500
      });
      expect(mockMetricsService.calculateMonthlyIncomeMedian).toHaveBeenCalledWith({
        _id: budgetId
      });
      expect(mockMetricsService.calculateMonthlyExpenseMedian).toHaveBeenCalledWith({
        _id: budgetId
      });
    });
  });
});
