import { NextRequest, NextResponse } from 'next/server';
import { ProductModel, CategoryModel } from '@/models';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json(
        { error: 'Product identifier is required' },
        { status: 400 }
      );
    }

    // Try to find product by slug or ID
    const product = await ProductModel.findByIdOrSlug(id);

    if (!product || !product.isActive) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Get the actual ID for incrementing view count
    const productId = product._id?.toString() || id;

    // Get category and subcategory if they exist
    let category = null;
    let subcategory = null;

    if (product.categoryId) {
      category = await CategoryModel.findById(product.categoryId.toString());
    }

    // Increment view count
    await ProductModel.incrementViewCount(productId);

    // Format response to match Prisma structure
    const productResponse = {
      ...product,
      id: product._id?.toString(),
      _id: undefined,
      categoryId: product.categoryId?.toString(),
      subcategoryId: product.subcategoryId?.toString(),
      category,
      subcategory
    };

    return NextResponse.json({ product: productResponse });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}
