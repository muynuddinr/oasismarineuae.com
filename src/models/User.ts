import { ObjectId } from 'mongodb';
import { getCollection, IUser, toObjectId } from '../lib/db';

export class UserModel {
  static collection = 'users';

  // Create a new user
  static async create(userData: Omit<IUser, '_id' | 'createdAt' | 'updatedAt'>): Promise<IUser> {
    const collection = await getCollection(this.collection);
    const now = new Date();
    
    const user: IUser = {
      ...userData,
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(user);
    return { ...user, _id: result.insertedId };
  }

  // Find user by ID
  static async findById(id: string): Promise<IUser | null> {
    const collection = await getCollection(this.collection);
    const user = await collection.findOne({ _id: toObjectId(id) }) as IUser | null;
    return user;
  }

  // Find user by email
  static async findByEmail(email: string): Promise<IUser | null> {
    const collection = await getCollection(this.collection);
    const user = await collection.findOne({ email }) as IUser | null;
    return user;
  }

  // Find all users
  static async findMany(filter: any = {}, options: any = {}): Promise<IUser[]> {
    const collection = await getCollection(this.collection);
    const users = await collection.find(filter, options).toArray() as IUser[];
    return users;
  }

  // Update user by ID
  static async updateById(id: string, updateData: Partial<IUser>): Promise<IUser | null> {
    const collection = await getCollection(this.collection);
    const now = new Date();
    
    const result = await collection.findOneAndUpdate(
      { _id: toObjectId(id) },
      { 
        $set: { 
          ...updateData, 
          updatedAt: now 
        }
      },
      { returnDocument: 'after' }
    );

    return result?.value as IUser | null;
  }

  // Delete user by ID
  static async deleteById(id: string): Promise<boolean> {
    const collection = await getCollection(this.collection);
    const result = await collection.deleteOne({ _id: toObjectId(id) });
    return result.deletedCount === 1;
  }

  // Count users
  static async count(filter: any = {}): Promise<number> {
    const collection = await getCollection(this.collection);
    return await collection.countDocuments(filter);
  }
}

export default UserModel;