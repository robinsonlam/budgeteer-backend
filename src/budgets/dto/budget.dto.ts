import { IsString, IsNumber, IsDateString, IsEnum, IsOptional, IsBoolean, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBudgetDto {
  @ApiProperty({
    description: 'Budget name',
    example: 'Monthly Groceries',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Budget description',
    example: 'Budget for monthly grocery expenses',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Total budget amount',
    example: 500.00,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  totalAmount: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'USD',
  })
  @IsString()
  currency: string;

  @ApiProperty({
    description: 'Budget category',
    example: 'Food & Dining',
  })
  @IsString()
  category: string;

  @ApiProperty({
    description: 'Budget period',
    enum: ['weekly', 'monthly', 'yearly', 'custom'],
    example: 'monthly',
  })
  @IsEnum(['weekly', 'monthly', 'yearly', 'custom'])
  period: 'weekly' | 'monthly' | 'yearly' | 'custom';

  @ApiProperty({
    description: 'Budget start date',
    example: '2025-01-01',
    format: 'date',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'Budget end date',
    example: '2025-01-31',
    format: 'date',
  })
  @IsDateString()
  endDate: string;

  @ApiProperty({
    description: 'Whether the budget is active',
    example: true,
    default: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}

export class UpdateBudgetDto {
  @ApiProperty({
    description: 'Budget name',
    example: 'Monthly Groceries',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Budget description',
    example: 'Budget for monthly grocery expenses',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Total budget amount',
    example: 500.00,
    minimum: 0,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  totalAmount?: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'USD',
    required: false,
  })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({
    description: 'Budget category',
    example: 'Food & Dining',
    required: false,
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({
    description: 'Budget period',
    enum: ['weekly', 'monthly', 'yearly', 'custom'],
    example: 'monthly',
    required: false,
  })
  @IsEnum(['weekly', 'monthly', 'yearly', 'custom'])
  @IsOptional()
  period?: 'weekly' | 'monthly' | 'yearly' | 'custom';

  @ApiProperty({
    description: 'Budget start date',
    example: '2025-01-01',
    format: 'date',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    description: 'Budget end date',
    example: '2025-01-31',
    format: 'date',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({
    description: 'Whether the budget is active',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
