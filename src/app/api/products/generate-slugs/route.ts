import { NextRequest, NextResponse } from 'next/server';
import { ProductModel } from '@/models';
import { generateSlug } from '@/utils/slug';

export async function POST(request: NextRequest) {
  try {
    // Get all products
    const products = await ProductModel.findMany();
    
    let updated = 0;
    let skipped = 0;
    const errors = [];

    for (const product of products) {
      // Skip if product already has a slug
      if (product.slug) {
        skipped++;
        continue;
      }

      // Generate slug from product name
      const slug = generateSlug(product.name);
      
      try {
        // Update product with slug
        await ProductModel.updateById(product._id!.toString(), { slug });
        updated++;
      } catch (error) {
        errors.push({
          productId: product._id?.toString(),
          productName: product.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Slug generation complete',
      stats: {
        total: products.length,
        updated,
        skipped,
        errors: errors.length
      },
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error generating slugs:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate slugs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
