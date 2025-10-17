import { NextRequest, NextResponse } from 'next/server';
import { ProductModel } from '@/models/Product';
import { toObjectId } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subcategoryId = searchParams.get('subcategoryId');
    const isActive = searchParams.get('isActive');
    const categoryId = searchParams.get('categoryId');

    // Build filter object
    const filter: any = {};
    
    if (subcategoryId) {
      try {
        filter.subcategoryId = toObjectId(subcategoryId);
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid subcategory ID format' },
          { status: 400 }
        );
      }
    }
    
    if (categoryId) {
      try {
        filter.categoryId = toObjectId(categoryId);
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid category ID format' },
          { status: 400 }
        );
      }
    }
    
    if (isActive !== null && isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    console.log('Product count filter:', filter);
    
    // Get product count
    const count = await ProductModel.count(filter);
    
    console.log(`Product count for filter:`, filter, `= ${count}`);

    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error fetching product count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product count' },
      { status: 500 }
    );
  }
}