import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    const productsCollection = await getCollection('products');
    
    // Search for FIRE BLANKET by name or slug
    const fireBlanketByName = await productsCollection.findOne({ 
      name: { $regex: /fire.*blanket/i }
    });
    
    const fireBlanketBySlug = await productsCollection.findOne({ 
      slug: 'fire-blanket'
    });
    
    const fireSafetyId = new ObjectId('68c26a51aae41600a374c673');
    
    return NextResponse.json({
      success: true,
      fireBlanketByName: fireBlanketByName ? {
        id: fireBlanketByName._id?.toString(),
        name: fireBlanketByName.name,
        slug: fireBlanketByName.slug,
        subcategoryId: fireBlanketByName.subcategoryId?.toString(),
        categoryId: fireBlanketByName.categoryId?.toString(),
        isActive: fireBlanketByName.isActive
      } : null,
      fireBlanketBySlug: fireBlanketBySlug ? {
        id: fireBlanketBySlug._id?.toString(),
        name: fireBlanketBySlug.name,
        slug: fireBlanketBySlug.slug,
        subcategoryId: fireBlanketBySlug.subcategoryId?.toString(),
        categoryId: fireBlanketBySlug.categoryId?.toString(),
        isActive: fireBlanketBySlug.isActive
      } : null,
      expectedFireSafetyId: fireSafetyId.toString(),
      issue: fireBlanketBySlug && fireBlanketBySlug.subcategoryId?.toString() !== fireSafetyId.toString()
        ? 'FIRE BLANKET exists but has WRONG subcategoryId!'
        : fireBlanketBySlug && !fireBlanketBySlug.isActive
        ? 'FIRE BLANKET exists but is INACTIVE!'
        : fireBlanketBySlug
        ? 'FIRE BLANKET exists with correct subcategoryId'
        : 'FIRE BLANKET does not exist'
    });
  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
