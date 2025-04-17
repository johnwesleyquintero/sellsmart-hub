import { Schema, model, models } from 'mongoose';

export interface User {
  email: string;
  name?: string;
  image?: string;
  emailVerified?: Date;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<User>(
  {
    email: { type: String, required: true, unique: true },
    name: String,
    image: String,
    emailVerified: Date,
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
  },
  {
    timestamps: true,
  },
);

export const UserModel = models.User || model<User>('User', userSchema);
