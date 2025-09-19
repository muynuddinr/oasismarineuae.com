import { ObjectId } from 'mongodb';
import { getCollection, ISubcategory } from '@/lib/db';

export class SubcategoryModel {
  static async create(data: Omit<ISubcategory, '_id' | 'createdAt' | 'updatedAt'>): Promise<ISubcategory> {
    const collection = await getCollection('subcategories');
    const now = new Date();
    
    const subcategory: ISubcategory = {
      ...data,
      categoryId: new ObjectId(data.categoryId),
      createdAt: now,
      updatedAt: now
    };

    const result = await collection.insertOne(subcategory);
    return { ...subcategory, _id: result.insertedId };
  }

  static async findById(id: string): Promise<ISubcategory | null> {
    const collection = await getCollection('subcategories');
    return await collection.findOne({ _id: new ObjectId(id) }) as ISubcategory | null;
  }

  static async findMany(
    filter: any = {}, 
    options: { sort?: any; limit?: number; skip?: number } = {}
  ): Promise<ISubcategory[]> {
    const collection = await getCollection('subcategories');
    let query = collection.find(filter);
    
    if (options.sort) {
      query = query.sort(options.sort);
    }
    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.skip) {
      query = query.skip(options.skip);
    }
    
    return await query.toArray() as ISubcategory[];
  }

  static async updateById(id: string, data: Partial<ISubcategory>): Promise<ISubcategory | null> {
    const collection = await getCollection('subcategories');
    const updateData = { 
      ...data, 
      updatedAt: new Date() 
    };
    
    if (data.categoryId) {
      updateData.categoryId = new ObjectId(data.categoryId);
    }
    
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );
    
    return result?.value as ISubcategory | null;
  }

  static async deleteById(id: string): Promise<boolean> {
    const collection = await getCollection('subcategories');
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }

  static async count(filter: any = {}): Promise<number> {
    const collection = await getCollection('subcategories');
    return await collection.countDocuments(filter);
  }

  static async findByCategoryId(categoryId: string): Promise<ISubcategory[]> {
    const collection = await getCollection('subcategories');
    return await collection.find({ categoryId: new ObjectId(categoryId) })
      .sort({ order: 1 })
      .toArray() as ISubcategory[];
  }

  static async getMaxOrder(categoryId?: string): Promise<number> {
    const collection = await getCollection('subcategories');
    const filter = categoryId ? { categoryId: new ObjectId(categoryId) } : {};
    
    const result = await collection.findOne(filter, { 
      sort: { order: -1 },
      projection: { order: 1 }
    });
    
    return result?.order || 0;
  }
}