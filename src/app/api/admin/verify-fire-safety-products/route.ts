import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    const productsCollection = await getCollection('products');
    const fireSafetyId = new ObjectId('68c26a51aae41600a374c673');
    
    // Get products directly from MongoDB
    const dbProducts = await productsCollection.find({
      subcategoryId: fireSafetyId
    }).toArray();
    
    // Check if FIRE BLANKET is in the list
    const fireBlanket = dbProducts.find((p: any) => 
      p.name === 'FIRE BLANKET' || p.slug === 'fire-blanket'
    );
    
    // Simulate what the API returns
    const transformedProducts = dbProducts.map((product: any) => {
      const { _id, ...productWithoutId } = product;
      return {
        ...productWithoutId,
        id: _id?.toString() || '',
        categoryId: product.categoryId?.toString(),
        subcategoryId: product.subcategoryId?.toString(),
      };
    });
    
    return NextResponse.json({
      success: true,
      database: {
        total: dbProducts.length,
        active: dbProducts.filter((p: any) => p.isActive).length,
        fireBlanketExists: !!fireBlanket,
        fireBlanketDetails: fireBlanket ? {
          id: fireBlanket._id?.toString(),
          name: fireBlanket.name,
          isActive: fireBlanket.isActive,
          slug: fireBlanket.slug
        } : null
      },
      apiWouldReturn: {
        total: transformedProducts.length,
        productNames: transformedProducts.map((p: any) => p.name).sort()
      },
      allProductIds: dbProducts.map((p: any) => ({
        id: p._id?.toString(),
        name: p.name
      })),
      issue: dbProducts.length === 13 && fireBlanket
        ? 'Database has 13 products including FIRE BLANKET - API should return all 13'
        : 'Unknown issue'
    });
  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
