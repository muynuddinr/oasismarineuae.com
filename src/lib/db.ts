import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Validate environment variables at runtime
function validateSupabaseConfig() {
  if (!SUPABASE_URL) {
    throw new Error('Please define NEXT_PUBLIC_SUPABASE_URL environment variable');
  }
  if (!SUPABASE_SERVICE_KEY) {
    throw new Error('Please define SUPABASE_SERVICE_ROLE_KEY environment variable');
  }
}

// Cached Supabase client
let supabaseClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  validateSupabaseConfig();
  
  supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  return supabaseClient;
}

// Helper function to check if a string is a valid UUID
export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// Legacy compatibility - toObjectId now just validates UUID
export function toObjectId(id: string): string {
  if (!isValidUUID(id)) {
    throw new Error(`Invalid UUID format: ${id}`);
  }
  return id;
}

// Type definitions for our models (camelCase for app, snake_case in DB)
export interface ICategory {
  _id?: string;
  id?: string;
  name: string;
  href: string;
  isCategory: boolean;
  visible: boolean;
  order: number;
  image?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ISubcategory {
  _id?: string;
  id?: string;
  name: string;
  href: string;
  categoryId?: string;
  visible: boolean;
  order: number;
  image?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IProduct {
  _id?: string;
  id?: string;
  name: string;
  slug?: string;
  shortDescription?: string;
  longDescription?: string;
  cardImage?: string;
  detailImages?: string[];
  shortFeatures?: string[];
  specifications?: Record<string, unknown>;
  reviewsData?: Record<string, unknown>;
  catalogFile?: string;
  categoryId?: string;
  subcategoryId?: string;
  isActive: boolean;
  viewCount: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IContact {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied';
  priority: 'low' | 'medium' | 'high';
  userId?: string;
  productId?: string;
  productName?: string;
  productImage?: string;
  enquiryType?: 'product' | 'general' | 'support';
  createdAt: Date | string;
  updatedAt: Date | string;
  repliedAt?: Date | string | null;
}

export interface IContactSubmission {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied';
  priority: 'low' | 'medium' | 'high';
  source?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  repliedAt?: Date | string | null;
}

// Helper to convert DB row (snake_case) to app model (camelCase)
export function dbToModel<T>(row: Record<string, unknown>): T {
  if (!row) return row as T;
  
  const result: Record<string, unknown> = {};
  for (const key in row) {
    // Convert snake_case to camelCase
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = row[key];
    
    // Add _id alias for id (MongoDB compatibility)
    if (key === 'id') {
      result['_id'] = row[key];
    }
  }
  return result as T;
}

// Helper to convert app model (camelCase) to DB row (snake_case)
export function modelToDb(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key in obj) {
    // Skip _id as we use id in Supabase
    if (key === '_id') continue;
    
    // Convert camelCase to snake_case
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    result[snakeKey] = obj[key];
  }
  return result;
}

// Legacy ObjectId compatibility - now just a string type
export type ObjectId = string;