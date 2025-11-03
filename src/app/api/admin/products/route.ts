import { NextRequest, NextResponse } from 'next/server';
import { ProductModel } from '@/models/Product';
import { toObjectId, ObjectId } from '@/lib/db';
import { cookies } from 'next/headers';
import { generateSlug, generateUniqueSlug } from '@/utils/slug';

// Check admin authentication
async function checkAdminAuth() {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get('adminSession');
  return adminSession?.value === 'true';
}

// Disable caching for this route to always get fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const subcategoryId = searchParams.get('subcategoryId');

    console.log('Products API - GET request with filters:', JSON.stringify({
      categoryId,
      subcategoryId
    }));

    const filter: any = {};
    // Convert to ObjectId for proper MongoDB querying
    if (categoryId) filter.categoryId = toObjectId(categoryId);
    if (subcategoryId) filter.subcategoryId = toObjectId(subcategoryId);

    const products = await ProductModel.findMany(filter, { sort: { createdAt: -1 } });
    
    console.log(`${products.length} total products`);
    const activeProducts = products.filter(p => p.isActive);
    console.log(`Active products: ${activeProducts.length}`);
    
    if (activeProducts.length > 0) {
      console.log('First 3 products:', activeProducts.slice(0, 3).map(p => ({ 
        name: p.name, 
        isActive: p.isActive,
        id: p._id?.toString() || 'no-id',
        _id: p._id
      })));
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

    console.log('Transformed products sample:', transformedProducts.slice(0, 2).map(p => ({
      name: p.name,
      id: p.id,
      hasIdField: 'id' in p,
      hasUnderscoreId: '_id' in p
    })));

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
    // Check admin authentication
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const body = await request.json();
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
    console.log('📝 Creating product with data:', {
      name,
      categoryId,
      subcategoryId,
      hasSubcategoryId: !!subcategoryId,
      subcategoryIdType: typeof subcategoryId,
      subcategoryIdValue: subcategoryId
    });

    // Convert string IDs to ObjectIds (MongoDB expects ObjectId type)
    const categoryObjectId = categoryId ? toObjectId(categoryId) : undefined;
    const subcategoryObjectId = subcategoryId ? toObjectId(subcategoryId) : undefined;

    console.log('✅ Converted to ObjectIds:', {
      categoryObjectId: categoryObjectId?.toString(),
      subcategoryObjectId: subcategoryObjectId?.toString()
    });

    // Generate slug from product name
    const baseSlug = generateSlug(name);
    
    // Get existing slugs to ensure uniqueness
    const existingProducts = await ProductModel.findMany({});
    const existingSlugs = existingProducts
      .map(p => p.slug)
      .filter((slug): slug is string => slug != null);
    
    // Generate unique slug
    const uniqueSlug = generateUniqueSlug(baseSlug, existingSlugs);
    
    console.log('🔗 Generated slug:', uniqueSlug);

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

    console.log('✅ Product created successfully:', transformedProduct.name);
    
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
    console.log('PUT request received for product update');
    
    // Check admin authentication
    const isAdmin = await checkAdminAuth();
    console.log('Admin authentication result:', isAdmin);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    
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

    console.log('Product ID to update:', id);
    console.log('Product ID type:', typeof id);

    if (!id) {
      console.log('Missing product ID in PUT request');
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Convert string IDs to ObjectIds (MongoDB expects ObjectId type)
    const categoryObjectId = categoryId ? toObjectId(categoryId) : undefined;
    const subcategoryObjectId = subcategoryId ? toObjectId(subcategoryId) : undefined;

    console.log('🔄 Converting IDs for update:', {
      categoryId,
      subcategoryId,
      categoryObjectId: categoryObjectId?.toString(),
      subcategoryObjectId: subcategoryObjectId?.toString()
    });

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
      console.log('🔗 Regenerated slug for update:', newSlug);
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

    console.log('Update data prepared:', JSON.stringify(updateData, null, 2));
    console.log('Attempting to update product with ID:', id);

    const product = await ProductModel.updateById(id, updateData);
    console.log('Update result:', product ? 'Success' : 'Product not found');

    if (!product) {
      console.log('Product not found for ID:', id);
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
    console.log('DELETE request received for product deletion');
    
    // Check admin authentication
    const isAdmin = await checkAdminAuth();
    console.log('Admin authentication result:', isAdmin);
    
    if (!isAdmin) {
      console.log('Unauthorized access attempt for product deletion');
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    console.log('Product ID to delete:', id);
    console.log('Product ID type:', typeof id);

    if (!id) {
      console.log('No product ID provided');
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      console.log('Invalid ObjectId format for product deletion:', id);
      return NextResponse.json(
        { error: 'Invalid product ID format' },
        { status: 400 }
      );
    }

    console.log('Attempting to delete product with ID:', id);
    const deleted = await ProductModel.deleteById(id);
    console.log('Product deletion result:', deleted);

    if (!deleted) {
      console.log('Product not found for deletion, ID:', id);
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    console.log('Product deleted successfully:', id);
    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
