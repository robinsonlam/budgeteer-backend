import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { User } from './interfaces/user.interface';
import { CreateUserDto } from './dto/user.dto';
import { ObjectId } from 'mongodb';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private databaseService: DatabaseService) {}

  private get collection() {
    return this.databaseService.getDb().collection<User>('users');
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    
    const user: Omit<User, '_id'> = {
      email: createUserDto.email,
      password: hashedPassword,
      name: createUserDto.name,
      provider: 'local',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await this.collection.insertOne(user as User);
    return { ...user, _id: result.insertedId };
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.collection.findOne({ email });
  }

  async findById(id: string): Promise<User | null> {
    return this.collection.findOne({ _id: new ObjectId(id) });
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.collection.findOne({ googleId });
  }

  async createGoogleUser(profile: any): Promise<User> {
    const user: Omit<User, '_id'> = {
      email: profile.emails[0].value,
      name: profile.displayName,
      googleId: profile.id,
      provider: 'google',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await this.collection.insertOne(user as User);
    return { ...user, _id: result.insertedId };
  }

  async validatePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}
