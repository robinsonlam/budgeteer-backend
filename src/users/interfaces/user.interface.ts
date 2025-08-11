import { ObjectId } from 'mongodb';

export interface User {
  _id?: ObjectId;
  email: string;
  password?: string;
  name?: string;
  googleId?: string;
  provider: 'local' | 'google';
  createdAt: Date;
  updatedAt: Date;
}
