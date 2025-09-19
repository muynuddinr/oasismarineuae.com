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

    const product = await ProductModel.findById(id);

    if (!product || !product.isActive) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Get category and subcategory if they exist
    let category = null;
    let subcategory = null;

    if (product.categoryId) {
      category = await CategoryModel.findById(product.categoryId.toString());
    }

    // Increment view count
    await ProductModel.incrementViewCount(id);

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
