import { NextRequest, NextResponse } from 'next/server';
import { CategoryModel } from '@/models/Category';
import { SubcategoryModel } from '@/models/Subcategory';
import { cookies } from 'next/headers';

// Check admin authentication
async function checkAdminAuth() {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get('adminSession');
  return adminSession?.value === 'true';
}

export async function GET() {
  try {
    // Skip database operations during build time
    if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
      return NextResponse.json({ categories: [] });
    }

    const categories = await CategoryModel.findMany(
      {}, 
      { sort: { order: 1 } }
    );

    // Fetch subcategories for each category
    const categoriesWithSubcategories = await Promise.all(
      categories.map(async (cat) => {
        const subcategories = await SubcategoryModel.findByCategoryId(cat._id?.toString() || '');
        
        return {
          ...cat,
          id: cat._id?.toString(),
          subcategories: subcategories.map(sub => ({
            ...sub,
            id: sub._id?.toString(),
            categoryId: sub.categoryId?.toString()
          }))
        };
      })
    );

    return NextResponse.json({ categories: categoriesWithSubcategories });
  } catch (error) {
    console.error('Error fetching navigation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch navigation' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const { name, href, isCategory, visible = true, order } = await request.json();

    if (!name || !href) {
      return NextResponse.json(
        { error: 'Name and href are required' },
        { status: 400 }
      );
    }

    // Get max order value
    const categories = await CategoryModel.findMany({}, { sort: { order: -1 }, limit: 1 });
    const maxOrder = categories.length > 0 ? categories[0].order || 0 : 0;
    
    const finalOrder = order || (maxOrder + 1);

    const category = await CategoryModel.create({
      name,
      href,
      isCategory: isCategory || false,
      visible,
      order: finalOrder
    });

    // Transform _id to id for frontend compatibility
    const transformedCategory = {
      ...category,
      id: category._id?.toString(),
      subcategories: []
    };

    return NextResponse.json({ category: transformedCategory });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const { id, name, href, isCategory, visible } = await request.json();
    console.log('PUT request data:', { id, name, href, isCategory, visible });

    if (!id) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (href !== undefined) updateData.href = href;
    if (isCategory !== undefined) updateData.isCategory = isCategory;
    if (visible !== undefined) updateData.visible = visible;

    console.log('Update data:', updateData);
    const category = await CategoryModel.updateById(id, updateData);
    console.log('Updated category:', category);

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Transform _id to id for frontend compatibility
    const transformedCategory = {
      ...category,
      id: category._id?.toString(),
      subcategories: []
    };

    return NextResponse.json({ category: transformedCategory });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

    const deleted = await CategoryModel.deleteById(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}
