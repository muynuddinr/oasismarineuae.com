import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ProductModel } from '@/models/Product';
import { CategoryModel } from '@/models/Category';

// Check admin authentication
async function checkAdminAuth() {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get('adminSession');
  return adminSession?.value === 'true';
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, productIds, categoryId, subcategoryId, status } = await request.json();

    switch (action) {
      case 'bulk_update_category':
        if (!productIds || !Array.isArray(productIds)) {
          return NextResponse.json({ error: 'Product IDs are required' }, { status: 400 });
        }

        const updateData: any = {};
        if (categoryId) updateData.categoryId = categoryId;
        if (subcategoryId) updateData.subcategoryId = subcategoryId;

        for (const productId of productIds) {
          await ProductModel.updateById(productId, updateData);
        }

        return NextResponse.json({ 
          message: `Updated ${productIds.length} products successfully`,
          updatedCount: productIds.length
        });

      case 'bulk_update_status':
        if (!productIds || !Array.isArray(productIds)) {
          return NextResponse.json({ error: 'Product IDs are required' }, { status: 400 });
        }

        for (const productId of productIds) {
          await ProductModel.updateById(productId, { isActive: status === 'active' });
        }

        return NextResponse.json({ 
          message: `Updated status for ${productIds.length} products successfully`,
          updatedCount: productIds.length
        });

      case 'bulk_delete':
        if (!productIds || !Array.isArray(productIds)) {
          return NextResponse.json({ error: 'Product IDs are required' }, { status: 400 });
        }

        for (const productId of productIds) {
          await ProductModel.deleteById(productId);
        }

        return NextResponse.json({ 
          message: `Deleted ${productIds.length} products successfully`,
          deletedCount: productIds.length
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Product management API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get categories for the management interface
    const categories = await CategoryModel.findMany({});
    
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Product management GET API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
