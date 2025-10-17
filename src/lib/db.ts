import { MongoClient, Db, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.DATABASE_URL;
const MONGODB_DB = 'oasismarineuae';

// During build time, DATABASE_URL might not be available
// Only throw error when actually trying to connect
function validateDatabaseUrl() {
  if (!MONGODB_URI) {
    throw new Error('Please define the DATABASE_URL environment variable inside .env');
  }
}

interface MongoConnection {
  client: MongoClient;
  db: Db;
}

let cached: MongoConnection | null = null;

export async function connectToDatabase(): Promise<MongoConnection> {
  if (cached) {
    return cached;
  }

  // Validate DATABASE_URL is available at runtime
  validateDatabaseUrl();
  
  try {
    const client = new MongoClient(MONGODB_URI!);
    await client.connect();
    
    const db = client.db(MONGODB_DB);
    
    cached = { client, db };
    
    console.log('✅ Connected to MongoDB Atlas');
    return cached;
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    throw error;
  }
}

export async function getCollection(collectionName: string) {
  const { db } = await connectToDatabase();
  return db.collection(collectionName);
}

// Helper function to convert string ID to ObjectId
export function toObjectId(id: string) {
  try {
    return new ObjectId(id);
  } catch (error) {
    console.error('Invalid ObjectId format:', id);
    throw new Error(`Invalid ObjectId format: ${id}`);
  }
}

// Helper function to convert ObjectId to string
export function fromObjectId(objectId: ObjectId) {
  return objectId.toString();
}

// Type definitions for our models
export interface IUser {
  _id?: ObjectId;
  name?: string;
  email?: string;
  emailVerified?: Date;
  image?: string;
  role?: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

export interface ICategory {
  _id?: ObjectId;
  name: string;
  href: string;
  isCategory: boolean;
  visible: boolean;
  order: number;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISubcategory {
  _id?: ObjectId;
  name: string;
  href: string;
  categoryId: ObjectId;
  visible: boolean;
  order: number;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProduct {
  _id?: ObjectId;
  name: string;
  slug?: string;
  shortDescription: string;
  longDescription?: string;
  cardImage: string;
  detailImages: string[];
  shortFeatures: string[];
  specifications?: any;
  reviewsData?: any;
  catalogFile?: string;
  categoryId?: ObjectId;
  subcategoryId?: ObjectId;
  isActive: boolean;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IContact {
  _id?: ObjectId;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied';
  priority: 'low' | 'medium' | 'high';
  userId?: ObjectId;
  productId?: ObjectId;
  productName?: string;
  productImage?: string;
  enquiryType?: 'product' | 'general' | 'support';
  createdAt: Date;
  updatedAt: Date;
  repliedAt?: Date;
}

export interface IContactSubmission {
  _id?: ObjectId;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied';
  priority: 'low' | 'medium' | 'high';
  source: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
  repliedAt?: Date;
}

export { ObjectId };