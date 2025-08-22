import { IsString, IsDateString, IsOptional, IsBoolean, IsNumber } from 'class-validator';
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
    description: 'Budget start date',
    example: '2025-01-01',
    format: 'date',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'Starting balance for the budget',
    example: 0,
    required: false,
    default: 0,
  })
  @IsNumber()
  @IsOptional()
  startBalance?: number;

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
    description: 'Budget start date',
    example: '2025-01-01',
    format: 'date',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    description: 'Starting balance for the budget',
    example: 0,
    required: false,
    default: 0,
  })
  @IsNumber()
  @IsOptional()
  startBalance?: number;

  @ApiProperty({
    description: 'Whether the budget is active',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
