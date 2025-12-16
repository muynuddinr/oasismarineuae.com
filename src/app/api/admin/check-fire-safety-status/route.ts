import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    const productsCollection = await getCollection('products');
    const fireSafetyId = new ObjectId('68c26a51aae41600a374c673');
    
    // Get ALL Fire Safety products (including inactive)
    const allProducts = await productsCollection.find({
      subcategoryId: fireSafetyId
    }).toArray();
    
    const productDetails = allProducts.map((p: any) => ({
      id: p._id?.toString(),
      name: p.name,
      isActive: p.isActive,
      slug: p.slug,
      createdAt: p.createdAt
    }));
    
    // Separate active and inactive
    const activeProducts = productDetails.filter(p => p.isActive === true);
    const inactiveProducts = productDetails.filter(p => p.isActive !== true);
    
    // Sort by name
    productDetails.sort((a, b) => a.name.localeCompare(b.name));
    
    return NextResponse.json({
      success: true,
      summary: {
        total: allProducts.length,
        active: activeProducts.length,
        inactive: inactiveProducts.length
      },
      allProducts: productDetails,
      activeProducts: activeProducts,
      inactiveProducts: inactiveProducts,
      analysis: {
        issue: activeProducts.length === 12 && allProducts.length === 13 
          ? "One product is INACTIVE - that's why frontend shows 12 instead of 13"
          : activeProducts.length === 13
          ? "All 13 products are active"
          : "Unknown issue"
      }
    });
  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
