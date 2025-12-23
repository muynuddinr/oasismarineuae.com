import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { generateSlug } from '@/utils/slug';

export async function POST(request: NextRequest) {
  try {
    const productsCollection = await getCollection('products');
    const fireSafetyId = new ObjectId('68c26a51aae41600a374c673');
    
    // Create FIRE BLANKET product
    const newProduct = {
      name: 'FIRE BLANKET',
      slug: generateSlug('FIRE BLANKET'),
      shortDescription: 'Fire safety blanket for emergency use',
      longDescription: 'A fire blanket made from heat-resistant woven fiber, designed to smother small fires by cutting off oxygen supply, suitable for marine, industrial and domestic use.',
      cardImage: 'https://res.cloudinary.com/dpdl6z0hu/image/upload/v1757571662/product-images/file_isqtpa.jpg',
      detailImages: [],
      shortFeatures: [],
      specifications: {},
      reviewsData: {},
      catalogFile: '',
      categoryId: new ObjectId('68b0006dc17f5c9596ae9d3a'),
      subcategoryId: fireSafetyId,
      isActive: true,
      viewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Check if FIRE BLANKET already exists
    const existing = await productsCollection.findOne({ 
      name: 'FIRE BLANKET',
      subcategoryId: fireSafetyId
    });
    
    if (existing) {
      return NextResponse.json({
        success: false,
        message: 'FIRE BLANKET already exists',
        product: {
          id: existing._id?.toString(),
          name: existing.name,
          isActive: existing.isActive
        }
      });
    }
    
    // Insert the product
    const result = await productsCollection.insertOne(newProduct);
    
    console.log('✅ Created FIRE BLANKET product:', result.insertedId.toString());
    
    // Verify it was created
    const allFireProducts = await productsCollection.find({
      subcategoryId: fireSafetyId
    }).toArray();
    
    return NextResponse.json({
      success: true,
      message: 'FIRE BLANKET created successfully',
      newProduct: {
        id: result.insertedId.toString(),
        name: newProduct.name,
        slug: newProduct.slug
      },
      totalFireSafetyProducts: allFireProducts.length,
      instructions: [
        '1. Refresh the admin panel',
        '2. Filter by Fire Safety subcategory',
        '3. You should now see 13 products',
        '4. Refresh the frontend: http://localhost:3000/products/fire-safety',
        '5. You should see 13 products on the frontend too'
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
