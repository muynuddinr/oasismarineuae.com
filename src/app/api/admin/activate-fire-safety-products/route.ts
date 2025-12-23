import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';
import { ObjectId } from 'mongodb';

export async function POST() {
  try {
    const productsCollection = await getCollection('products');
    const fireSafetyId = new ObjectId('68c26a51aae41600a374c673');
    
    // Find all Fire Safety products that are inactive
    const inactiveProducts = await productsCollection.find({
      subcategoryId: fireSafetyId,
      isActive: { $ne: true }
    }).toArray();
    
    if (inactiveProducts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All Fire Safety products are already active',
        activatedCount: 0
      });
    }
    
    // Activate all inactive Fire Safety products
    const result = await productsCollection.updateMany(
      {
        subcategoryId: fireSafetyId,
        isActive: { $ne: true }
      },
      {
        $set: { isActive: true }
      }
    );
    
    console.log('✅ Activated', result.modifiedCount, 'Fire Safety products');
    
    return NextResponse.json({
      success: true,
      message: `Activated ${result.modifiedCount} Fire Safety product(s)`,
      activatedCount: result.modifiedCount,
      activatedProducts: inactiveProducts.map((p: any) => ({
        id: p._id?.toString(),
        name: p.name,
        wasInactive: p.isActive !== true
      }))
    });
  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
