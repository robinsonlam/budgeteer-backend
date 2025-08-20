import { IsString, IsNumber, IsDateString, IsEnum, IsOptional, IsBoolean, IsArray, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TransactionType, PaymentMethod, RecurringFrequency } from '../../common/enums';

export class CreateTransactionDto {
  @ApiProperty({
    description: 'Budget ID this transaction belongs to',
    example: '60a7b3d4c123456789abcdef',
  })
  @IsString()
  budgetId: string;

  @ApiProperty({
    description: 'Transaction amount',
    example: 85.50,
    minimum: 0,
  })
  @IsNumber()
  amount: number;

  @ApiProperty({
    description: 'Transaction type',
    enum: TransactionType,
    example: TransactionType.EXPENSE,
  })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiProperty({
    description: 'Transaction category',
    example: 'Groceries',
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({
    description: 'Transaction subcategory',
    example: 'Organic Foods',
    required: false,
  })
  @IsString()
  @IsOptional()
  subcategory?: string;

  @ApiProperty({
    description: 'Transaction description',
    example: 'Grocery shopping at Whole Foods',
  })
  @IsString()
  @IsOptional()
  description: string;

  @ApiProperty({
    description: 'Transaction date',
    example: '2025-01-15',
    format: 'date',
  })
  @IsDateString()
  date: string;

  @ApiProperty({
    description: 'Payment method used',
    enum: PaymentMethod,
    example: PaymentMethod.CREDIT_CARD,
  })
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @ApiProperty({
    description: 'Whether the transaction is recurring',
    example: false,
    default: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean = false;

  @ApiProperty({
    description: 'How often the transaction recurs',
    enum: RecurringFrequency,
    example: RecurringFrequency.MONTHLY,
    required: false,
  })
  @IsEnum(RecurringFrequency)
  @IsOptional()
  recurringFrequency?: RecurringFrequency;

  @ApiProperty({
    description: 'Additional notes for the transaction',
    example: 'Weekly grocery shopping',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateTransactionDto {
  @ApiProperty({
    description: 'Transaction amount',
    example: 85.50,
    minimum: 0,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  amount?: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'USD',
    required: false,
  })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({
    description: 'Transaction type',
    enum: TransactionType,
    example: TransactionType.EXPENSE,
    required: false,
  })
  @IsEnum(TransactionType)
  @IsOptional()
  type?: TransactionType;

  @ApiProperty({
    description: 'Transaction category',
    example: 'Groceries',
    required: false,
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({
    description: 'Transaction subcategory',
    example: 'Organic Foods',
    required: false,
  })
  @IsString()
  @IsOptional()
  subcategory?: string;

  @ApiProperty({
    description: 'Transaction description',
    example: 'Grocery shopping at Whole Foods',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Transaction date',
    example: '2025-01-15',
    format: 'date',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  date?: string;

  @ApiProperty({
    description: 'Payment method used',
    enum: PaymentMethod,
    example: PaymentMethod.CREDIT_CARD,
    required: false,
  })
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @ApiProperty({
    description: 'Whether the transaction is recurring',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean;

  @ApiProperty({
    description: 'How often the transaction recurs',
    enum: RecurringFrequency,
    example: RecurringFrequency.MONTHLY,
    required: false,
  })
  @IsEnum(RecurringFrequency)
  @IsOptional()
  recurringFrequency?: RecurringFrequency;

  @ApiProperty({
    description: 'Additional notes for the transaction',
    example: 'Weekly grocery shopping',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
