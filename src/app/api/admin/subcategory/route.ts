import { NextRequest, NextResponse } from 'next/server';
import { SubcategoryModel } from '@/models/Subcategory';
import { cookies } from 'next/headers';

// Check admin authentication
async function checkAdminAuth() {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get('adminSession');
  return adminSession?.value === 'true';
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

    const { name, href, categoryId, visible = true, order, image } = await request.json();

    if (!name || !href || !categoryId) {
      return NextResponse.json(
        { error: 'Name, href, and categoryId are required' },
        { status: 400 }
      );
    }

    const maxOrder = await SubcategoryModel.getMaxOrder(categoryId);
    const finalOrder = order || (maxOrder + 1);

    const subcategory = await SubcategoryModel.create({
      name,
      href,
      categoryId,
      visible,
      order: finalOrder,
      image: image || undefined
    });

    return NextResponse.json({ subcategory });
  } catch (error) {
    console.error('Error creating subcategory:', error);
    return NextResponse.json(
      { error: 'Failed to create subcategory' },
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

    const { id, name, href, visible, image } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Subcategory ID is required' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (href !== undefined) updateData.href = href;
    if (visible !== undefined) updateData.visible = visible;
    if (image !== undefined) updateData.image = image;

    const subcategory = await SubcategoryModel.updateById(id, updateData);

    if (!subcategory) {
      return NextResponse.json(
        { error: 'Subcategory not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ subcategory });
  } catch (error) {
    console.error('Error updating subcategory:', error);
    return NextResponse.json(
      { error: 'Failed to update subcategory' },
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
        { error: 'Subcategory ID is required' },
        { status: 400 }
      );
    }

    const deleted = await SubcategoryModel.deleteById(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Subcategory not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Subcategory deleted successfully' });
  } catch (error) {
    console.error('Error deleting subcategory:', error);
    return NextResponse.json(
      { error: 'Failed to delete subcategory' },
      { status: 500 }
    );
  }
}
