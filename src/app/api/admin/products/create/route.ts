import { NextRequest, NextResponse } from 'next/server';
import { ProductModel } from '@/models/Product';
import { toObjectId, ObjectId } from '@/lib/db';
import { generateSlug, generateUniqueSlug } from '@/utils/slug';
import { uploadToCloudinary, validateImageSize, validateImageType, validatePdfType } from '@/utils/cloudinary';
import CategoryModel from '@/models/Category';
import { SubcategoryModel } from '@/models/Subcategory';

/**
 * POST /api/admin/products/create
 * 
 * Create a product with image uploads to Cloudinary
 * 
 * Form data should include:
 * - name: string
 * - shortDescription: string
 * - longDescription: string (optional)
 * - cardImage: File (product card/thumbnail image)
 * - detailImages: File[] (product detail images)
 * - catalogFile: File (optional, PDF)
 * - shortFeatures: JSON string array
 * - specifications: JSON object
 * - categoryId: string (ObjectId)
 * - subcategoryId: string (ObjectId)
 * - isActive: boolean
 */
export async function POST(request: NextRequest) {
  try {
    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('Cloudinary not configured');
      return NextResponse.json(
        { error: 'Cloudinary configuration missing' },
        { status: 500 }
      );
    }

    const formData = await request.formData();

    // Extract fields
    const name = formData.get('name') as string;
    const shortDescription = formData.get('shortDescription') as string;
    const longDescription = formData.get('longDescription') as string;
    const categoryId = formData.get('categoryId') as string;
    const subcategoryId = formData.get('subcategoryId') as string;
    const isActiveStr = formData.get('isActive') as string;
    const shortFeaturesStr = formData.get('shortFeatures') as string;
    const specificationsStr = formData.get('specifications') as string;

    // Validate required fields
    if (!name || !shortDescription) {
      return NextResponse.json(
        { error: 'Name and short description are required' },
        { status: 400 }
      );
    }

    // Get card image
    const cardImageFile = formData.get('cardImage') as File;
    if (!cardImageFile) {
      return NextResponse.json(
        { error: 'Card image is required' },
        { status: 400 }
      );
    }

    // Validate card image
    if (!validateImageType(cardImageFile.type)) {
      return NextResponse.json(
        { error: 'Invalid card image type. Only JPEG, PNG, WebP, GIF are allowed.' },
        { status: 400 }
      );
    }

    if (!validateImageSize(cardImageFile.size)) {
      return NextResponse.json(
        { error: 'Card image too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Upload card image to Cloudinary
    let cardImageUrl: string;
    try {
      const cardImageBuffer = Buffer.from(await cardImageFile.arrayBuffer());
      cardImageUrl = await uploadToCloudinary(
        cardImageBuffer,
        cardImageFile.name,
        'product-images/cards'
      );
      console.log('✅ Card image uploaded to Cloudinary:', cardImageUrl);
    } catch (error) {
      console.error('Error uploading card image:', error);
      return NextResponse.json(
        { error: 'Failed to upload card image' },
        { status: 500 }
      );
    }

    // Handle detail images
    const detailImageUrls: string[] = [];
    const detailImagesFiles = formData.getAll('detailImages') as File[];
    
    for (const imageFile of detailImagesFiles) {
      if (!imageFile || imageFile.size === 0) continue;

      // Validate image
      if (!validateImageType(imageFile.type)) {
        console.warn('Invalid detail image type:', imageFile.type);
        continue;
      }

      if (!validateImageSize(imageFile.size)) {
        console.warn('Detail image too large:', imageFile.name);
        continue;
      }

      try {
        const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
        const imageUrl = await uploadToCloudinary(
          imageBuffer,
          imageFile.name,
          'product-images/details'
        );
        detailImageUrls.push(imageUrl);
        console.log('✅ Detail image uploaded:', imageUrl);
      } catch (error) {
        console.error('Error uploading detail image:', error);
        // Continue with other images instead of failing completely
      }
    }

    // Handle catalog file (optional)
    let catalogFileUrl: string | undefined;
    const catalogFile = formData.get('catalogFile') as File;
    if (catalogFile && catalogFile.size > 0) {
      if (!validatePdfType(catalogFile.type)) {
        return NextResponse.json(
          { error: 'Invalid catalog file type. Only PDF is allowed.' },
          { status: 400 }
        );
      }

      if (!validateImageSize(catalogFile.size)) {
        return NextResponse.json(
          { error: 'Catalog file too large. Maximum size is 5MB.' },
          { status: 400 }
        );
      }

      try {
        const catalogBuffer = Buffer.from(await catalogFile.arrayBuffer());
        catalogFileUrl = await uploadToCloudinary(
          catalogBuffer,
          catalogFile.name,
          'product-catalogs',
          'raw'
        );
        console.log('✅ Catalog file uploaded:', catalogFileUrl);
      } catch (error) {
        console.error('Error uploading catalog file:', error);
        // Don't fail completely if catalog upload fails
      }
    }

    // Parse JSON fields
    let shortFeatures: string[] = [];
    let specifications: Record<string, any> = {};

    try {
      if (shortFeaturesStr) {
        shortFeatures = JSON.parse(shortFeaturesStr);
      }
    } catch (e) {
      console.warn('Invalid shortFeatures JSON:', e);
      shortFeatures = [];
    }

    try {
      if (specificationsStr) {
        specifications = JSON.parse(specificationsStr);
      }
    } catch (e) {
      console.warn('Invalid specifications JSON:', e);
      specifications = {};
    }

    // Convert category and subcategory IDs
    let categoryObjectId: ObjectId | undefined;
    let subcategoryObjectId: ObjectId | undefined;

    try {
      if (categoryId) {
        categoryObjectId = toObjectId(categoryId);
      }
      if (subcategoryId) {
        subcategoryObjectId = toObjectId(subcategoryId);
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid category or subcategory ID format' },
        { status: 400 }
      );
    }

    // Generate unique slug
    const baseSlug = generateSlug(name);
    const existingProducts = await ProductModel.findMany({});
    const existingSlugs = existingProducts
      .map(p => p.slug)
      .filter((slug): slug is string => slug != null);
    const uniqueSlug = generateUniqueSlug(baseSlug, existingSlugs);

    // Create product with Cloudinary URLs stored in MongoDB
    const product = await ProductModel.create({
      name,
      slug: uniqueSlug,
      shortDescription,
      longDescription,
      cardImage: cardImageUrl, // Cloudinary URL
      detailImages: detailImageUrls, // Array of Cloudinary URLs
      shortFeatures,
      specifications,
      catalogFile: catalogFileUrl,
      categoryId: categoryObjectId,
      subcategoryId: subcategoryObjectId,
      isActive: isActiveStr === 'true' || isActiveStr === '1',
      viewCount: 0
    });

    console.log('✅ Product created:', product._id);

    // Return product with transformed IDs
    const { _id, ...productWithoutId } = product;
    const transformedProduct = {
      ...productWithoutId,
      id: _id?.toString() || '',
      categoryId: product.categoryId?.toString(),
      subcategoryId: product.subcategoryId?.toString(),
    };

    return NextResponse.json(
      { 
        message: 'Product created successfully with Cloudinary images',
        product: transformedProduct 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
