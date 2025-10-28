import { NextResponse } from 'next/server';
import { toObjectId } from '@/lib/db';
import ProductModel from '@/models/Product';
import CategoryModel from '@/models/Category';
import { SubcategoryModel } from '@/models/Subcategory';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const categoryId = searchParams.get('categoryId');
    const subcategoryId = searchParams.get('subcategoryId');
    
    let products;
    
    // If slug is provided, find by slug specifically
    if (slug) {
      const product = await ProductModel.findBySlug(slug);
      products = product ? [product] : [];
    } else {
      // Build query for other filters
      const query: any = {};
      
      if (categoryId) {
        query.categoryId = toObjectId(categoryId);
      }
      
      if (subcategoryId) {
        query.subcategoryId = toObjectId(subcategoryId);
      }
      
      products = await ProductModel.findMany(query);
    }
    
    // Populate category and subcategory information
    const productsWithRelations = await Promise.all(
      products.map(async (product) => {
        const productObj: any = { ...product };
        
        // Get category and subcategory details if needed
        if (productObj.categoryId) {
          const category = await CategoryModel.findById(productObj.categoryId.toString());
          if (category) {
            productObj.category = category;
          }
        }
        
        if (productObj.subcategoryId) {
          const subcategory = await SubcategoryModel.findById(productObj.subcategoryId.toString());
          if (subcategory) {
            productObj.subcategory = subcategory;
          }
        }
        
        return {
          ...productObj,
          id: productObj._id?.toString(),
        };
      })
    );
    
    return NextResponse.json(productsWithRelations);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
