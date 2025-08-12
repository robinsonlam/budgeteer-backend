import { Controller, Get } from '@nestjs/common';
import { BUDGET_CATEGORIES, TRANSACTION_CATEGORIES, CURRENCIES, PAYMENT_METHODS } from './constants';

@Controller('constants')
export class ConstantsController {
  @Get('budget-categories')
  getBudgetCategories() {
    return { categories: BUDGET_CATEGORIES };
  }

  @Get('transaction-categories')
  getTransactionCategories() {
    return TRANSACTION_CATEGORIES;
  }

  @Get('currencies')
  getCurrencies() {
    return { currencies: CURRENCIES };
  }

  @Get('payment-methods')
  getPaymentMethods() {
    return { paymentMethods: PAYMENT_METHODS };
  }

  @Get('all')
  getAllConstants() {
    return {
      budgetCategories: BUDGET_CATEGORIES,
      transactionCategories: TRANSACTION_CATEGORIES,
      currencies: CURRENCIES,
      paymentMethods: PAYMENT_METHODS
    };
  }
}
