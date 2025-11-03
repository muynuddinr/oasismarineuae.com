import { ObjectId } from 'mongodb';
import { getCollection, IProduct, toObjectId } from '../lib/db';

export class ProductModel {
  static collection = 'products';

  // Create a new product
  static async create(productData: Omit<IProduct, '_id' | 'createdAt' | 'updatedAt'>): Promise<IProduct> {
    const collection = await getCollection(this.collection);
    const now = new Date();
    
    const product: IProduct = {
      ...productData,
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(product);
    return { ...product, _id: result.insertedId };
  }

  // Find product by ID
  static async findById(id: string): Promise<IProduct | null> {
    const collection = await getCollection(this.collection);
    const product = await collection.findOne({ _id: toObjectId(id) }) as IProduct | null;
    return product;
  }

  // Find product by slug
  static async findBySlug(slug: string): Promise<IProduct | null> {
    const collection = await getCollection(this.collection);
    const product = await collection.findOne({ slug: slug }) as IProduct | null;
    return product;
  }

  // Find product by ID or slug
  static async findByIdOrSlug(identifier: string): Promise<IProduct | null> {
    const collection = await getCollection(this.collection);
    
    // Try to find by slug first
    let product = await collection.findOne({ slug: identifier }) as IProduct | null;
    
    // If not found and identifier looks like an ObjectId, try finding by ID
    if (!product && identifier.match(/^[0-9a-fA-F]{24}$/)) {
      product = await collection.findOne({ _id: toObjectId(identifier) }) as IProduct | null;
    }
    
    return product;
  }

  // Find all products
  static async findMany(filter: any = {}, options: any = {}): Promise<IProduct[]> {
    const collection = await getCollection(this.collection);
    const products = await collection.find(filter, options).toArray() as IProduct[];
    return products;
  }

  // Find active products
  static async findActive(options: any = {}): Promise<IProduct[]> {
    const collection = await getCollection(this.collection);
    const products = await collection.find(
      { isActive: true },
      options
    ).toArray() as IProduct[];
    return products;
  }

  // Find products by category
  static async findByCategory(categoryId: string, options: any = {}): Promise<IProduct[]> {
    const collection = await getCollection(this.collection);
    const products = await collection.find(
      { categoryId: toObjectId(categoryId), isActive: true },
      options
    ).toArray() as IProduct[];
    return products;
  }

  // Find products by subcategory
  static async findBySubcategory(subcategoryId: string, options: any = {}): Promise<IProduct[]> {
    const collection = await getCollection(this.collection);
    const products = await collection.find(
      { subcategoryId: toObjectId(subcategoryId), isActive: true },
      options
    ).toArray() as IProduct[];
    return products;
  }

  // Search products by name or description
  static async search(searchTerm: string, options: any = {}): Promise<IProduct[]> {
    const collection = await getCollection(this.collection);
    const products = await collection.find(
      {
        isActive: true,
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { shortDescription: { $regex: searchTerm, $options: 'i' } },
          { longDescription: { $regex: searchTerm, $options: 'i' } }
        ]
      },
      options
    ).toArray() as IProduct[];
    return products;
  }

  // Update product by ID
  static async updateById(id: string, updateData: Partial<IProduct>): Promise<IProduct | null> {
    console.log('ProductModel.updateById called with ID:', id);
    console.log('Update data:', JSON.stringify(updateData, null, 2));
    
    const collection = await getCollection(this.collection);
    const now = new Date();
    
    try {
      const objectId = toObjectId(id);
      console.log('Converted to ObjectId:', objectId);
      
      const result = await collection.findOneAndUpdate(
        { _id: objectId },
        { 
          $set: { 
            ...updateData, 
            updatedAt: now 
          }
        },
        { 
          returnDocument: 'after',
          upsert: false
        }
      );

      console.log('MongoDB findOneAndUpdate result:', result);
      console.log('Document found:', !!result);
      
      return result as IProduct | null;
    } catch (error) {
      console.error('Error in ProductModel.updateById:', error);
      throw error;
    }
  }

  // Increment view count
  static async incrementViewCount(id: string): Promise<boolean> {
    const collection = await getCollection(this.collection);
    const result = await collection.updateOne(
      { _id: toObjectId(id) },
      { 
        $inc: { viewCount: 1 },
        $set: { updatedAt: new Date() }
      }
    );
    return result.modifiedCount === 1;
  }

  // Delete product by ID
  static async deleteById(id: string): Promise<boolean> {
    const collection = await getCollection(this.collection);
    const result = await collection.deleteOne({ _id: toObjectId(id) });
    return result.deletedCount === 1;
  }

  // Count products
  static async count(filter: any = {}): Promise<number> {
    const collection = await getCollection(this.collection);
    return await collection.countDocuments(filter);
  }

  // Get featured products (most viewed)
  static async getFeatured(limit: number = 10): Promise<IProduct[]> {
    const collection = await getCollection(this.collection);
    const products = await collection.find(
      { isActive: true },
      { 
        sort: { viewCount: -1 },
        limit: limit
      }
    ).toArray() as IProduct[];
    return products;
  }

  // Get latest products
  static async getLatest(limit: number = 10): Promise<IProduct[]> {
    const collection = await getCollection(this.collection);
    const products = await collection.find(
      { isActive: true },
      { 
        sort: { createdAt: -1 },
        limit: limit
      }
    ).toArray() as IProduct[];
    return products;
  }
}

export default ProductModel;