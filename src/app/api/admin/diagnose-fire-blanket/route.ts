import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    const productsCollection = await getCollection('products');
    
    // Search for FIRE BLANKET by ID
    const fireBlanketById = await productsCollection.findOne({ 
      _id: new ObjectId('68f2266e2d7fb65598049012')
    });
    
    // Search for all products with 'blanket' in name
    const blanketProducts = await productsCollection.find({
      name: { $regex: /blanket/i }
    }).toArray();
    
    // Get ALL Fire Safety products
    const fireSafetyId = new ObjectId('68c26a51aae41600a374c673');
    const allFireSafetyProducts = await productsCollection.find({
      subcategoryId: fireSafetyId
    }).toArray();
    
    return NextResponse.json({
      success: true,
      fireBlanketById: fireBlanketById ? {
        id: fireBlanketById._id?.toString(),
        name: fireBlanketById.name,
        slug: fireBlanketById.slug,
        subcategoryId: fireBlanketById.subcategoryId?.toString(),
        isActive: fireBlanketById.isActive,
        hasCorrectSubcategoryId: fireBlanketById.subcategoryId?.toString() === fireSafetyId.toString()
      } : 'FIRE BLANKET ID 68f2266e2d7fb65598049012 NOT FOUND',
      allBlanketProducts: blanketProducts.map((p: any) => ({
        id: p._id?.toString(),
        name: p.name,
        subcategoryId: p.subcategoryId?.toString(),
        isActive: p.isActive
      })),
      fireSafetyProducts: {
        count: allFireSafetyProducts.length,
        names: allFireSafetyProducts.map((p: any) => p.name).sort()
      },
      diagnosis: fireBlanketById 
        ? (fireBlanketById.subcategoryId?.toString() === fireSafetyId.toString()
          ? 'FIRE BLANKET exists with CORRECT subcategoryId but is NOT in Fire Safety query results!'
          : `FIRE BLANKET exists but has WRONG subcategoryId: ${fireBlanketById.subcategoryId?.toString()}`)
        : 'FIRE BLANKET with ID 68f2266e2d7fb65598049012 does NOT exist in database'
    });
  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
