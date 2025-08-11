import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongoClient, Db } from 'mongodb';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private client: MongoClient;
  private db: Db;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const uri = this.configService.get<string>('MONGODB_URI');
    this.client = new MongoClient(uri);
    await this.client.connect();
    this.db = this.client.db();
    console.log('Connected to MongoDB');
  }

  async onModuleDestroy() {
    await this.client.close();
  }

  getDb(): Db {
    return this.db;
  }

  getClient(): MongoClient {
    return this.client;
  }
}
