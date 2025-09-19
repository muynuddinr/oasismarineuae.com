import { ObjectId } from 'mongodb';
import { getCollection, ICategory, toObjectId } from '../lib/db';

export class CategoryModel {
  static collection = 'categories';

  // Create a new category
  static async create(categoryData: Omit<ICategory, '_id' | 'createdAt' | 'updatedAt'>): Promise<ICategory> {
    const collection = await getCollection(this.collection);
    const now = new Date();
    
    const category: ICategory = {
      ...categoryData,
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(category);
    return { ...category, _id: result.insertedId };
  }

  // Find category by ID
  static async findById(id: string): Promise<ICategory | null> {
    const collection = await getCollection(this.collection);
    const category = await collection.findOne({ _id: toObjectId(id) }) as ICategory | null;
    return category;
  }

  // Find all categories
  static async findMany(filter: any = {}, options: any = {}): Promise<ICategory[]> {
    const collection = await getCollection(this.collection);
    const categories = await collection.find(filter, options).toArray() as ICategory[];
    return categories;
  }

  // Find visible categories ordered by order field
  static async findVisible(): Promise<ICategory[]> {
    const collection = await getCollection(this.collection);
    const categories = await collection.find(
      { visible: true },
      { sort: { order: 1 } }
    ).toArray() as ICategory[];
    return categories;
  }

  // Update category by ID
  static async updateById(id: string, updateData: Partial<ICategory>): Promise<ICategory | null> {
    const collection = await getCollection(this.collection);
    const now = new Date();
    
    console.log('CategoryModel.updateById called with:', { id, updateData });
    
    try {
      // Try to find by ObjectId first
      let query: any = {};
      
      try {
        const objectId = toObjectId(id);
        query = { _id: objectId };
        console.log('Using ObjectId query:', query);
      } catch (objectIdError) {
        // If ObjectId conversion fails, try to find by id field (legacy compatibility)
        query = { id: id };
        console.log('Using string id query:', query);
      }
      
      const result = await collection.findOneAndUpdate(
        query,
        { 
          $set: { 
            ...updateData, 
            updatedAt: now 
          }
        },
        { returnDocument: 'after' }
      );

      console.log('MongoDB findOneAndUpdate result:', result);
      return result as ICategory | null;
    } catch (error) {
      console.error('Error in CategoryModel.updateById:', error);
      throw error;
    }
  }

  // Delete category by ID
  static async deleteById(id: string): Promise<boolean> {
    const collection = await getCollection(this.collection);
    const result = await collection.deleteOne({ _id: toObjectId(id) });
    return result.deletedCount === 1;
  }

  // Count categories
  static async count(filter: any = {}): Promise<number> {
    const collection = await getCollection(this.collection);
    return await collection.countDocuments(filter);
  }

  // Find category by href
  static async findByHref(href: string): Promise<ICategory | null> {
    const collection = await getCollection(this.collection);
    const category = await collection.findOne({ href }) as ICategory | null;
    return category;
  }
}

export default CategoryModel;