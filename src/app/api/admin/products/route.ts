import { NextRequest, NextResponse } from 'next/server';
import { ProductModel } from '@/models/Product';
import { toObjectId, ObjectId } from '@/lib/db';
import { cookies } from 'next/headers';
import { generateSlug, generateUniqueSlug } from '@/utils/slug';
import { z } from 'zod';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Validation schema for products
const productSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  price: z.number().optional(),
  categoryId: z.string().optional(),
  subcategoryId: z.string().optional(),
  isActive: z.boolean().default(true),
  images: z.array(z.string()).optional(),
  specifications: z.record(z.any()).optional(),
});

// Disable caching for this route to always get fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const subcategoryId = searchParams.get('subcategoryId');

    const filter: any = {};
    // Convert to ObjectId for proper MongoDB querying
    if (categoryId) filter.categoryId = toObjectId(categoryId);
    if (subcategoryId) filter.subcategoryId = toObjectId(subcategoryId);

    const products = await ProductModel.findMany(filter, { sort: { createdAt: -1 } });
    
    const activeProducts = products.filter(p => p.isActive);
    
    if (activeProducts.length > 0) {
      // Logging removed
    }

    // Transform products to ensure they have id field instead of _id
    const transformedProducts = products.map(product => {
      const { _id, ...productWithoutId } = product;
      return {
        ...productWithoutId,
        id: _id?.toString() || '',
        categoryId: product.categoryId?.toString(),
        subcategoryId: product.subcategoryId?.toString(),
      };
    });

    // Return with cache control headers to prevent caching
    return NextResponse.json(
      { products: transformedProducts },
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
  try {
    // CSRF check
    const csrfToken = request.headers.get('x-csrf-token');
    if (!csrfToken || csrfToken !== process.env.CSRF_SECRET) {
      console.warn('Invalid CSRF token');
      return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
    }

    const body = await request.json();

    // Validate input
    const validated = productSchema.safeParse(body);
    if (!validated.success) {
      console.warn('Invalid product data:', validated.error.errors);
      return NextResponse.json(
        { error: 'Invalid product data' },
        { status: 400 }
      );
    }

    const data = validated.data;

    // Sanitize strings
    const window = new JSDOM('').window;
    const DOMPurifyServer = DOMPurify(window);
    data.name = DOMPurifyServer.sanitize(data.name);
    if (data.description) data.description = DOMPurifyServer.sanitize(data.description);

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

    // Convert string IDs to ObjectIds (MongoDB expects ObjectId type)
    const categoryObjectId = categoryId ? toObjectId(categoryId) : undefined;
    const subcategoryObjectId = subcategoryId ? toObjectId(subcategoryId) : undefined;

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
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {

    const body = await request.json();

    // Validate input (partial update, so optional fields)
    const updateSchema = productSchema.partial();
    const validated = updateSchema.safeParse(body);
    if (!validated.success) {
      console.warn('Invalid product update data:', validated.error.errors);
      return NextResponse.json(
        { error: 'Invalid product update data' },
        { status: 400 }
      );
    }

    const data = validated.data;

    // Sanitize
    const window = new JSDOM('').window;
    const DOMPurifyServer = DOMPurify(window);
    if (data.name) data.name = DOMPurifyServer.sanitize(data.name);
    if (data.description) data.description = DOMPurifyServer.sanitize(data.description);

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

    // Convert string IDs to ObjectIds (MongoDB expects ObjectId type)
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

    return NextResponse.json({ product: transformedProduct });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid product ID format' },
        { status: 400 }
      );
    }

    const deleted = await ProductModel.deleteById(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
