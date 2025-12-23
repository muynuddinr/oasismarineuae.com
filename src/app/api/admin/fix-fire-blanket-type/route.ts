import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';
import { ObjectId } from 'mongodb';

export async function POST() {
  try {
    const productsCollection = await getCollection('products');
    const fireSafetyId = new ObjectId('68c26a51aae41600a374c673');
    const fireBlanketId = new ObjectId('68f2266e2d7fb65598049012');
    
    // Get FIRE BLANKET
    const fireBlanket = await productsCollection.findOne({ _id: fireBlanketId });
    
    if (!fireBlanket) {
      return NextResponse.json({
        success: false,
        error: 'FIRE BLANKET not found'
      });
    }
    
    // Check the type of subcategoryId
    const subcategoryIdType = typeof fireBlanket.subcategoryId;
    const isObjectId = fireBlanket.subcategoryId instanceof ObjectId;
    const isString = typeof fireBlanket.subcategoryId === 'string';
    
    console.log('FIRE BLANKET subcategoryId type:', subcategoryIdType);
    console.log('Is ObjectId:', isObjectId);
    console.log('Is String:', isString);
    console.log('Value:', fireBlanket.subcategoryId);
    
    // Fix: Convert subcategoryId to ObjectId if it's a string
    const updateResult = await productsCollection.updateOne(
      { _id: fireBlanketId },
      { 
        $set: { 
          subcategoryId: fireSafetyId,  // Ensure it's ObjectId
          categoryId: new ObjectId('68b0006dc17f5c9596ae9d3a')  // Ensure categoryId is also ObjectId
        } 
      }
    );
    
    console.log('✅ Update result:', updateResult);
    
    // Verify it now appears in Fire Safety query
    const fireProducts = await productsCollection.find({
      subcategoryId: fireSafetyId
    }).toArray();
    
    const fireBlanketInResults = fireProducts.find((p: any) => 
      p._id.toString() === fireBlanketId.toString()
    );
    
    return NextResponse.json({
      success: true,
      message: 'Fixed FIRE BLANKET subcategoryId type',
      before: {
        subcategoryIdType,
        isObjectId,
        isString,
        value: fireBlanket.subcategoryId?.toString()
      },
      updateResult: {
        matched: updateResult.matchedCount,
        modified: updateResult.modifiedCount
      },
      after: {
        totalFireSafetyProducts: fireProducts.length,
        fireBlanketIncluded: !!fireBlanketInResults
      },
      nextSteps: [
        '1. Refresh admin panel - should now show 13 products',
        '2. Hard refresh frontend: Ctrl+Shift+R on http://localhost:3000/products/fire-safety',
        '3. Should now see 13 products including FIRE BLANKET'
      ]
    });
  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
