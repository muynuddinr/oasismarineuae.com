import { NextRequest, NextResponse } from 'next/server';
import { ProductModel } from '@/models/Product';
import { toObjectId, isValidUUID } from '@/lib/db';
import { generateSlug, generateUniqueSlug } from '@/utils/slug';
import { z } from 'zod';
import CategoryModel from '@/models/Category';
import { SubcategoryModel } from '@/models/Subcategory';
import DashboardStatsModel from '@/models/DashboardStats';
import { requireAdminAuth } from '@/middleware/adminAuth';
import { logAdminActionFromRequest } from '@/middleware/auditLog';

// Sanitize function for server-side
function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>\"']/g, (char) => {
      const map: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
      }
      return map[char] || char
    })
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';

// Validation schema for products
const productSchema = z.object({
  name: z.string().min(1).max(200),
  shortDescription: z.string().min(1),
  longDescription: z.string().optional(),
  cardImage: z.string().min(1),
  detailImages: z.array(z.string()).optional().default([]),
  shortFeatures: z.array(z.string()).optional().default([]),
  specifications: z.record(z.string(), z.any()).optional(),
  reviewsData: z.record(z.string(), z.any()).optional(),
  catalogFile: z.string().optional(),
  categoryId: z.string().optional(),
  subcategoryId: z.string().optional(),
  isActive: z.boolean().default(true),
  description: z.string().optional(), // for backward compatibility
  price: z.number().optional(),
  images: z.array(z.string()).optional(),
});

// Disable caching for this route to always get fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const categoryId = searchParams.get('categoryId');
    const subcategoryId = searchParams.get('subcategoryId');
    
    let products;
    
    // If slug is provided, find by slug specifically
    if (slug) {
      const product = await ProductModel.findBySlug(slug);
      products = product ? [product] : [];
    } else {
      // Build query for other filters
      const query: any = {};
      
      if (categoryId) {
        try {
          query.categoryId = toObjectId(categoryId);
        } catch (error) {
          console.warn('Invalid categoryId format:', categoryId);
          return NextResponse.json(
            { error: 'Invalid category ID format' },
            { status: 400 }
          );
        }
      }
      
      if (subcategoryId) {
        try {
          query.subcategoryId = toObjectId(subcategoryId);
        } catch (error) {
          console.warn('Invalid subcategoryId format:', subcategoryId);
          return NextResponse.json(
            { error: 'Invalid subcategory ID format' },
            { status: 400 }
          );
        }
      }
      
      products = await ProductModel.findMany(query);
    }
    
    // Filter only active products
    const activeProducts = products.filter(p => p.isActive);
    
    // Populate category and subcategory information
    const productsWithRelations = await Promise.all(
      activeProducts.map(async (product) => {
        const productObj: any = { ...product };
        
        // Get category and subcategory details if needed
        if (productObj.categoryId) {
          const category = await CategoryModel.findById(productObj.categoryId.toString());
          if (category) {
            productObj.category = category;
          }
        }
        
        if (productObj.subcategoryId) {
          const subcategory = await SubcategoryModel.findById(productObj.subcategoryId.toString());
          if (subcategory) {
            productObj.subcategory = subcategory;
          }
        }
        
        return {
          ...productObj,
          id: productObj._id?.toString(),
          categoryId: productObj.categoryId?.toString(),
          subcategoryId: productObj.subcategoryId?.toString(),
        };
      })
    );
    
    // Return in the expected format with cache control headers
    return NextResponse.json(
      { products: productsWithRelations },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    );
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // 🔒 AUTHENTICATION CHECK
  const authError = await requireAdminAuth(request);
  if (authError) {
    logAdminActionFromRequest(request, 'CREATE_PRODUCT_UNAUTHORIZED', false, null, 'Unauthorized attempt');
    return authError;
  }

  try {
    const body = await request.json();

    // Validate input
    const validated = productSchema.safeParse(body);
    if (!validated.success) {
      console.warn('Invalid product data:', validated.error.format());
      logAdminActionFromRequest(request, 'CREATE_PRODUCT_FAILED', false, body, 'Validation failed');
      return NextResponse.json(
        { error: 'Invalid product data' },
        { status: 400 }
      );
    }

    const data = validated.data;

    // Sanitize strings
    data.name = sanitizeInput(data.name);
    if (data.shortDescription) data.shortDescription = sanitizeInput(data.shortDescription);
    if (data.longDescription) data.longDescription = sanitizeInput(data.longDescription);
    if (data.description) data.description = sanitizeInput(data.description);

    const {
      name,
      shortDescription,
      longDescription,
      cardImage,
      detailImages,
      shortFeatures,
      specifications,
      reviewsData,
      catalogFile,
      categoryId,
      subcategoryId,
      isActive = true
    } = body;

    if (!name || !shortDescription || !cardImage) {
      return NextResponse.json(
        { error: 'Name, short description, and card image are required' },
        { status: 400 }
      );
    }

    // Log what we received to diagnose subcategory issues

    // Validate and use string IDs (Supabase uses UUIDs)
    let categoryObjectId;
    let subcategoryObjectId;
    
    try {
      categoryObjectId = categoryId ? toObjectId(categoryId) : undefined;
      subcategoryObjectId = subcategoryId ? toObjectId(subcategoryId) : undefined;
    } catch (error) {
      console.error('Invalid category or subcategory ID:', error);
      return NextResponse.json(
        { error: 'Invalid category or subcategory ID format' },
        { status: 400 }
      );
    }

    // Generate slug from product name
    const baseSlug = generateSlug(name);
    
    // Get existing slugs to ensure uniqueness
    const existingProducts = await ProductModel.findMany({});
    const existingSlugs = existingProducts
      .map(p => p.slug)
      .filter((slug): slug is string => slug != null);
    
    // Generate unique slug
    const uniqueSlug = generateUniqueSlug(baseSlug, existingSlugs);
    
    const product = await ProductModel.create({
      name,
      slug: uniqueSlug,
      shortDescription,
      longDescription,
      cardImage,
      detailImages: detailImages || [],
      shortFeatures: shortFeatures || [],
      specifications,
      reviewsData,
      catalogFile,
      categoryId: categoryObjectId,
      subcategoryId: subcategoryObjectId,
      isActive: isActive !== undefined ? isActive : true,
      viewCount: 0
    });

    // Transform product to match frontend expectations
    const { _id, ...productWithoutId } = product;
    const transformedProduct = {
      ...productWithoutId,
      id: _id?.toString() || '',
      categoryId: product.categoryId?.toString(),
      subcategoryId: product.subcategoryId?.toString(),
    };

    // 📝 LOG SUCCESS
    logAdminActionFromRequest(request, 'CREATE_PRODUCT_SUCCESS', true, { productId: _id?.toString(), name });

    // 📊 Update dashboard stats
    await DashboardStatsModel.increment('total_products');

    return NextResponse.json(
      { product: transformedProduct },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        }
      }
    );
  } catch (error) {
    console.error('Error creating product:', error);
    logAdminActionFromRequest(request, 'CREATE_PRODUCT_ERROR', false, null, error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  // 🔒 AUTHENTICATION CHECK
  const authError = await requireAdminAuth(request);
  if (authError) {
    logAdminActionFromRequest(request, 'UPDATE_PRODUCT_UNAUTHORIZED', false, null, 'Unauthorized attempt');
    return authError;
  }

  try {

    const body = await request.json();

    // Validate input (partial update, so optional fields)
    const updateSchema = productSchema.partial();
    const validated = updateSchema.safeParse(body);
    if (!validated.success) {
      console.warn('Invalid product update data:', validated.error.format());
      return NextResponse.json(
        { error: 'Invalid product update data' },
        { status: 400 }
      );
    }

    const data = validated.data;

    // Sanitize
    if (data.name) data.name = sanitizeInput(data.name);
    if (data.shortDescription) data.shortDescription = sanitizeInput(data.shortDescription);
    if (data.longDescription) data.longDescription = sanitizeInput(data.longDescription);
    if (data.description) data.description = sanitizeInput(data.description);

    const { 
      id, 
      name,
      shortDescription,
      longDescription,
      cardImage,
      detailImages,
      shortFeatures,
      specifications,
      reviewsData,
      catalogFile,
      categoryId,
      subcategoryId,
      isActive
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Validate and use string IDs (Supabase uses UUIDs)
    const categoryObjectId = categoryId ? toObjectId(categoryId) : undefined;
    const subcategoryObjectId = subcategoryId ? toObjectId(subcategoryId) : undefined;

    // Generate new slug if name is being updated
    let newSlug;
    if (name) {
      const baseSlug = generateSlug(name);
      
      // Get existing slugs (excluding current product)
      const existingProducts = await ProductModel.findMany({});
      const existingSlugs = existingProducts
        .filter(p => p._id?.toString() !== id) // Exclude current product
        .map(p => p.slug)
        .filter((slug): slug is string => slug != null);
      
      // Generate unique slug
      newSlug = generateUniqueSlug(baseSlug, existingSlugs);
    }

    // Prepare update data with only valid Product model fields
    const updateData: any = {
      name,
      slug: newSlug,
      shortDescription,
      longDescription,
      cardImage,
      detailImages: detailImages || [],
      shortFeatures: shortFeatures || [],
      specifications,
      reviewsData,
      catalogFile,
      categoryId: categoryObjectId,
      subcategoryId: subcategoryObjectId,
      isActive: isActive !== undefined ? isActive : true
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const product = await ProductModel.updateById(id, updateData);
    
    if (!product) {
      logAdminActionFromRequest(request, 'UPDATE_PRODUCT_NOT_FOUND', false, { id }, 'Product not found');
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Transform product to match frontend expectations
    const { _id, ...productWithoutId } = product;
    const transformedProduct = {
      ...productWithoutId,
      id: _id?.toString() || '',
      categoryId: product.categoryId?.toString(),
      subcategoryId: product.subcategoryId?.toString(),
    };

    // 📝 LOG SUCCESS
    logAdminActionFromRequest(request, 'UPDATE_PRODUCT_SUCCESS', true, { productId: id, updates: Object.keys(updateData) });

    return NextResponse.json({ product: transformedProduct });
  } catch (error) {
    console.error('Error updating product:', error);
    logAdminActionFromRequest(request, 'UPDATE_PRODUCT_ERROR', false, null, error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  // 🔒 AUTHENTICATION CHECK
  const authError = await requireAdminAuth(request);
  if (authError) {
    logAdminActionFromRequest(request, 'DELETE_PRODUCT_UNAUTHORIZED', false, null, 'Unauthorized attempt');
    return authError;
  }

  try {

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }
    
    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Validate UUID format
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: 'Invalid product ID format' },
        { status: 400 }
      );
    }

    const deleted = await ProductModel.deleteById(id);

    if (!deleted) {
      logAdminActionFromRequest(request, 'DELETE_PRODUCT_NOT_FOUND', false, { id }, 'Product not found');
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // 📝 LOG SUCCESS
    logAdminActionFromRequest(request, 'DELETE_PRODUCT_SUCCESS', true, { productId: id });

    // 📊 Update dashboard stats
    await DashboardStatsModel.decrement('total_products');

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    logAdminActionFromRequest(request, 'DELETE_PRODUCT_ERROR', false, null, error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
