import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards, 
  Request,
  Query
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto, UpdateTransactionDto } from './dto/transaction.dto';
import { JwtAuthGuard } from '../auth/guards/auth.guards';

@ApiTags('Transactions')
@ApiBearerAuth()
@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new transaction' })
  @ApiResponse({ status: 201, description: 'Transaction successfully created' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBody({ type: CreateTransactionDto })
  create(@Request() req, @Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionsService.create(req.user.userId, createTransactionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all transactions for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Returns list of transactions' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiQuery({ name: 'budgetId', required: false, description: 'Filter by budget ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Filter by start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Filter by end date (YYYY-MM-DD)' })
  findAll(
    @Request() req, 
    @Query('budgetId') budgetId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    if (startDate && endDate) {
      return this.transactionsService.findByDateRange(
        req.user.userId, 
        new Date(startDate), 
        new Date(endDate),
        budgetId
      );
    }
    return this.transactionsService.findAll(req.user.userId, budgetId);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get transaction summary for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Returns transaction summary' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiQuery({ name: 'budgetId', required: false, description: 'Filter by budget ID' })
  getSummary(@Request() req, @Query('budgetId') budgetId?: string) {
    return this.transactionsService.getTransactionSummary(req.user.userId, budgetId);
  }

  @Get('budget/:budgetId')
  @ApiOperation({ summary: 'Get transactions by budget ID' })
  @ApiResponse({ status: 200, description: 'Returns transactions for the budget' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiParam({ name: 'budgetId', description: 'Budget ID' })
  findByBudget(@Param('budgetId') budgetId: string, @Request() req) {
    return this.transactionsService.findByBudget(budgetId, req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific transaction by ID' })
  @ApiResponse({ status: 200, description: 'Returns the transaction' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.transactionsService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a transaction' })
  @ApiResponse({ status: 200, description: 'Transaction successfully updated' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  @ApiBody({ type: UpdateTransactionDto })
  update(
    @Param('id') id: string, 
    @Request() req, 
    @Body() updateTransactionDto: UpdateTransactionDto
  ) {
    return this.transactionsService.update(id, req.user.userId, updateTransactionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a transaction' })
  @ApiResponse({ status: 200, description: 'Transaction successfully deleted' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  remove(@Param('id') id: string, @Request() req) {
    return this.transactionsService.remove(id, req.user.userId);
  }
}
