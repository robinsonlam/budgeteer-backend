import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Transaction } from './interfaces/transaction.interface';
import { CreateTransactionDto, UpdateTransactionDto } from './dto/transaction.dto';
import { BudgetsService } from '../budgets/budgets.service';
import { ObjectId } from 'mongodb';

@Injectable()
export class TransactionsService {
  constructor(
    private databaseService: DatabaseService,
    private budgetsService: BudgetsService,
  ) {}

  private get collection() {
    return this.databaseService.getDb().collection<Transaction>('transactions');
  }

  async create(userId: string, createTransactionDto: CreateTransactionDto): Promise<Transaction> {
    // Verify budget exists and belongs to user
    await this.budgetsService.findOne(createTransactionDto.budgetId, userId);

    const transaction: Omit<Transaction, '_id'> = {
      userId: new ObjectId(userId),
      budgetId: new ObjectId(createTransactionDto.budgetId),
      amount: createTransactionDto.amount,
      type: createTransactionDto.type,
      category: createTransactionDto.category,
      subcategory: createTransactionDto.subcategory,
      description: createTransactionDto.description,
      date: new Date(createTransactionDto.date),
      paymentMethod: createTransactionDto.paymentMethod,
      isRecurring: createTransactionDto.isRecurring || false,
      recurringFrequency: createTransactionDto.recurringFrequency,
      notes: createTransactionDto.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await this.collection.insertOne(transaction as Transaction);
    
    // Update budget spent amount if it's an expense
    if (createTransactionDto.type === 'expense') {
      await this.budgetsService.updateSpentAmount(createTransactionDto.budgetId, createTransactionDto.amount);
    } else if (createTransactionDto.type === 'income') {
      // For income, we reduce the spent amount (negative expense)
      await this.budgetsService.updateSpentAmount(createTransactionDto.budgetId, -createTransactionDto.amount);
    }

    return { ...transaction, _id: result.insertedId };
  }

  async findAll(userId: string, budgetId?: string): Promise<Transaction[]> {
    const filter: any = { userId: new ObjectId(userId) };
    
    if (budgetId) {
      filter.budgetId = new ObjectId(budgetId);
    }

    return this.collection.find(filter).sort({ date: -1 }).toArray();
  }

  async findOne(id: string, userId: string): Promise<Transaction> {
    const transaction = await this.collection.findOne({ 
      _id: new ObjectId(id),
      userId: new ObjectId(userId)
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  async update(id: string, userId: string, updateTransactionDto: UpdateTransactionDto): Promise<Transaction> {
    const existingTransaction = await this.findOne(id, userId);
    
    const updateData: any = {
      ...updateTransactionDto,
      updatedAt: new Date(),
    };

    // Convert date string to Date object if provided
    if (updateTransactionDto.date) {
      updateData.date = new Date(updateTransactionDto.date);
    }

    // If amount or type is being updated, adjust budget accordingly
    if (updateTransactionDto.amount !== undefined || updateTransactionDto.type !== undefined) {
      const oldAmount = existingTransaction.type === 'expense' ? existingTransaction.amount : -existingTransaction.amount;
      const newAmount = (updateTransactionDto.type || existingTransaction.type) === 'expense' 
        ? (updateTransactionDto.amount || existingTransaction.amount)
        : -(updateTransactionDto.amount || existingTransaction.amount);
      
      const amountDifference = newAmount - oldAmount;
      await this.budgetsService.updateSpentAmount(existingTransaction.budgetId.toString(), amountDifference);
    }

    await this.collection.updateOne(
      { _id: new ObjectId(id), userId: new ObjectId(userId) },
      { $set: updateData }
    );

    return this.findOne(id, userId);
  }

  async remove(id: string, userId: string): Promise<void> {
    const transaction = await this.findOne(id, userId);
    
    const result = await this.collection.deleteOne({ 
      _id: new ObjectId(id),
      userId: new ObjectId(userId)
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException('Transaction not found');
    }

    // Reverse the budget amount change
    const amountToReverse = transaction.type === 'expense' ? -transaction.amount : transaction.amount;
    await this.budgetsService.updateSpentAmount(transaction.budgetId.toString(), amountToReverse);
  }

  async findByBudget(budgetId: string, userId: string): Promise<Transaction[]> {
    // Verify budget belongs to user
    await this.budgetsService.findOne(budgetId, userId);
    
    return this.collection.find({ 
      budgetId: new ObjectId(budgetId),
      userId: new ObjectId(userId)
    }).sort({ date: -1 }).toArray();
  }

  async getTransactionSummary(userId: string, budgetId?: string): Promise<any> {
    const filter: any = { userId: new ObjectId(userId) };
    
    if (budgetId) {
      filter.budgetId = new ObjectId(budgetId);
    }

    const transactions = await this.collection.find(filter).toArray();
    
    const summary = {
      totalTransactions: transactions.length,
      totalIncome: transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0),
      totalExpenses: transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0),
      netAmount: 0,
      transactionsByCategory: transactions.reduce((acc, transaction) => {
        if (!acc[transaction.category]) {
          acc[transaction.category] = {
            income: 0,
            expenses: 0,
            count: 0
          };
        }
        if (transaction.type === 'income') {
          acc[transaction.category].income += transaction.amount;
        } else {
          acc[transaction.category].expenses += transaction.amount;
        }
        acc[transaction.category].count += 1;
        return acc;
      }, {} as any),
      recentTransactions: transactions
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10)
    };

    summary.netAmount = summary.totalIncome - summary.totalExpenses;

    return summary;
  }

  async findByDateRange(userId: string, startDate: Date, endDate: Date, budgetId?: string): Promise<Transaction[]> {
    const filter: any = {
      userId: new ObjectId(userId),
      date: {
        $gte: startDate,
        $lte: endDate
      }
    };

    if (budgetId) {
      filter.budgetId = new ObjectId(budgetId);
    }

    return this.collection.find(filter).sort({ date: -1 }).toArray();
  }
}
