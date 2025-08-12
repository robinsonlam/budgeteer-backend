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
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto, UpdateBudgetDto } from './dto/budget.dto';
import { JwtAuthGuard } from '../auth/guards/auth.guards';

@ApiTags('Budgets')
@ApiBearerAuth()
@Controller('budgets')
@UseGuards(JwtAuthGuard)
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new budget' })
  @ApiResponse({ status: 201, description: 'Budget successfully created' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBody({ type: CreateBudgetDto })
  create(@Request() req, @Body() createBudgetDto: CreateBudgetDto) {
    return this.budgetsService.create(req.user.userId, createBudgetDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all budgets for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Returns list of budgets' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiQuery({ name: 'active', required: false, description: 'Filter by active budgets only' })
  findAll(@Request() req, @Query('active') active?: string) {
    if (active === 'true') {
      return this.budgetsService.findActiveByUserId(req.user.userId);
    }
    return this.budgetsService.findAll(req.user.userId);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get budget summary for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Returns budget summary' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getSummary(@Request() req) {
    return this.budgetsService.getBudgetSummary(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific budget by ID' })
  @ApiResponse({ status: 200, description: 'Returns the budget' })
  @ApiResponse({ status: 404, description: 'Budget not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiParam({ name: 'id', description: 'Budget ID' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.budgetsService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a budget' })
  @ApiResponse({ status: 200, description: 'Budget successfully updated' })
  @ApiResponse({ status: 404, description: 'Budget not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiParam({ name: 'id', description: 'Budget ID' })
  @ApiBody({ type: UpdateBudgetDto })
  update(
    @Param('id') id: string, 
    @Request() req, 
    @Body() updateBudgetDto: UpdateBudgetDto
  ) {
    return this.budgetsService.update(id, req.user.userId, updateBudgetDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a budget' })
  @ApiResponse({ status: 200, description: 'Budget successfully deleted' })
  @ApiResponse({ status: 404, description: 'Budget not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiParam({ name: 'id', description: 'Budget ID' })
  remove(@Param('id') id: string, @Request() req) {
    return this.budgetsService.remove(id, req.user.userId);
  }
}
