import { NextRequest, NextResponse } from 'next/server';
import { ProductModel } from '@/models/Product';
import { uploadToCloudinary } from '@/utils/cloudinary';
import fetch from 'node-fetch';

/**
 * POST /api/admin/products/migrate-to-cloudinary
 * 
 * Migrate existing product images to Cloudinary
 * This endpoint converts images from base64, URLs, or file paths to Cloudinary URLs
 * and stores the new URLs in MongoDB
 */
export async function POST(request: NextRequest) {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json(
        { error: 'Cloudinary not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { productId, migrateAll = false } = body;

    let products = [];

    // Get products to migrate
    if (migrateAll) {
      // Migrate all products
      products = await ProductModel.findMany({});
      console.log(`🔄 Starting migration of ${products.length} products...`);
    } else if (productId) {
      // Migrate single product
      const product = await ProductModel.findById(productId);
      if (!product) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }
      products = [product];
    } else {
      return NextResponse.json(
        { error: 'Either productId or migrateAll must be provided' },
        { status: 400 }
      );
    }

    const migrationResults = {
      total: products.length,
      successful: 0,
      failed: 0,
      skipped: 0,
      errors: [] as { productId: string; error: string }[]
    };

    for (const product of products) {
      try {
        const productId = product._id?.toString() || '';
        let needsUpdate = false;
        const updates: any = {};

        // Migrate card image
        if (product.cardImage && !isValidCloudinaryUrl(product.cardImage)) {
          try {
            const newCardImageUrl = await migrateImageToCloudinary(
              product.cardImage,
              product.name,
              'card'
            );
            if (newCardImageUrl) {
              updates.cardImage = newCardImageUrl;
              needsUpdate = true;
              console.log(`✅ Card image migrated for ${product.name}`);
            }
          } catch (err) {
            console.error(`Failed to migrate card image for ${product.name}:`, err);
            migrationResults.errors.push({
              productId,
              error: `Card image migration failed: ${String(err)}`
            });
          }
        }

        // Migrate detail images
        if (product.detailImages && product.detailImages.length > 0) {
          const migratedDetailImages: string[] = [];

          for (const detailImage of product.detailImages) {
            if (isValidCloudinaryUrl(detailImage)) {
              // Already a Cloudinary URL, keep it
              migratedDetailImages.push(detailImage);
            } else {
              try {
                const newDetailImageUrl = await migrateImageToCloudinary(
                  detailImage,
                  product.name,
                  'detail'
                );
                if (newDetailImageUrl) {
                  migratedDetailImages.push(newDetailImageUrl);
                }
              } catch (err) {
                console.error(`Failed to migrate detail image for ${product.name}:`, err);
              }
            }
          }

          if (migratedDetailImages.length !== product.detailImages.length) {
            console.warn(
              `Some detail images failed to migrate for ${product.name}: ` +
              `${migratedDetailImages.length}/${product.detailImages.length} successful`
            );
          }

          updates.detailImages = migratedDetailImages;
          needsUpdate = true;
        }

        // Update product in MongoDB with new Cloudinary URLs
        if (needsUpdate) {
          await ProductModel.updateById(productId, updates);
          migrationResults.successful++;
          console.log(`✅ Product ${product.name} updated in database`);
        } else {
          migrationResults.skipped++;
          console.log(`⏭️  Product ${product.name} already uses Cloudinary URLs`);
        }
      } catch (error) {
        migrationResults.failed++;
        migrationResults.errors.push({
          productId: product._id?.toString() || 'unknown',
          error: String(error)
        });
        console.error('Error migrating product:', error);
      }
    }

    console.log('📊 Migration Summary:', migrationResults);

    return NextResponse.json({
      message: 'Migration completed',
      results: migrationResults
    }, { status: 200 });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Check if a URL is already a valid Cloudinary URL
 */
function isValidCloudinaryUrl(imageString: string): boolean {
  if (!imageString) return false;

  // Check if it's a Cloudinary URL
  if (imageString.includes('cloudinary.com') || imageString.includes('res.cloudinary.com')) {
    return true;
  }

  // Check if it's a valid HTTP URL from another source
  if (imageString.startsWith('http://') || imageString.startsWith('https://')) {
    return false;
  }

  // Likely base64 or local path
  return false;
}

/**
 * Migrate an image to Cloudinary
 * Handles base64, URLs, and local paths
 */
async function migrateImageToCloudinary(
  imageData: string,
  productName: string,
  imageType: 'card' | 'detail'
): Promise<string | null> {
  try {
    let buffer: Buffer;

    // Check if it's a base64 string
    if (imageData.startsWith('data:image')) {
      const base64Data = imageData.split(',')[1];
      buffer = Buffer.from(base64Data, 'base64');
    } else if (imageData.startsWith('http://') || imageData.startsWith('https://')) {
      // It's a URL - fetch it
      try {
        const response = await fetch(imageData) as any;
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
      } catch (err) {
        console.warn(`Could not fetch image from URL: ${imageData}`, err);
        // Return the original URL if it's already a valid web URL
        return imageData;
      }
    } else {
      // Unknown format, skip
      console.warn(`Skipping image in unknown format for ${productName}`);
      return null;
    }

    // Upload to Cloudinary
    const folder = imageType === 'card' ? 'product-images/cards' : 'product-images/details';
    const cloudinaryUrl = await uploadToCloudinary(
      buffer,
      `${productName.replace(/\s+/g, '-')}-${imageType}`,
      folder
    );

    return cloudinaryUrl;
  } catch (error) {
    console.error('Error in migrateImageToCloudinary:', error);
    throw error;
  }
}
