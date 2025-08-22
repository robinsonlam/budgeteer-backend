import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Budget } from './interfaces/budget.interface';
import { CreateBudgetDto, UpdateBudgetDto } from './dto/budget.dto';
import { ObjectId } from 'mongodb';

@Injectable()
export class BudgetsService {
  constructor(private databaseService: DatabaseService) {}

  private get collection() {
    return this.databaseService.getDb().collection<Budget>('budgets');
  }

  async create(userId: string, createBudgetDto: CreateBudgetDto): Promise<Budget> {
    const budget: Omit<Budget, '_id'> = {
      userId: new ObjectId(userId),
      name: createBudgetDto.name,
      description: createBudgetDto.description,
      startDate: new Date(createBudgetDto.startDate),
      isActive: createBudgetDto.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await this.collection.insertOne(budget as Budget);
    return { ...budget, _id: result.insertedId };
  }

  async findAll(userId: string): Promise<Budget[]> {
    return this.collection.find({ userId: new ObjectId(userId) }).toArray();
  }

  async findOne(id: string, userId: string): Promise<Budget> {
    const budget = await this.collection.findOne({ 
      _id: new ObjectId(id),
      userId: new ObjectId(userId)
    });

    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    return budget;
  }

  async update(id: string, userId: string, updateBudgetDto: UpdateBudgetDto): Promise<Budget> {
    const updateData: any = {
      ...updateBudgetDto,
      updatedAt: new Date(),
    };

    // Convert date strings to Date objects if provided
    if (updateBudgetDto.startDate) {
      updateData.startDate = new Date(updateBudgetDto.startDate);
    }

    await this.collection.updateOne(
      { _id: new ObjectId(id), userId: new ObjectId(userId) },
      { $set: updateData }
    );

    return this.findOne(id, userId);
  }

  async remove(id: string, userId: string): Promise<void> {
    const result = await this.collection.deleteOne({ 
      _id: new ObjectId(id),
      userId: new ObjectId(userId)
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException('Budget not found');
    }
  }

  async findActiveByUserId(userId: string): Promise<Budget[]> {
    return this.collection.find({ 
      userId: new ObjectId(userId),
      isActive: true,
      startDate: { $lte: new Date() }
    }).toArray();
  }

  async getBudgetSummary(userId: string): Promise<any> {
    const budgets = await this.findActiveByUserId(userId);
    
    const summary = {
      totalBudgets: budgets.length,
      budgets: budgets.map(budget => ({
        _id: budget._id,
        name: budget.name,
        description: budget.description,
        startDate: budget.startDate,
        isActive: budget.isActive
      }))
    };

    return summary;
  }
}
