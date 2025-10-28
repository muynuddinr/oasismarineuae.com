import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ProductModel } from '@/models/Product';
import { CategoryModel } from '@/models/Category';
import { ContactModel } from '@/models/Contact';
import { UserModel } from '@/models/User';

// Check admin authentication
async function checkAdminAuth() {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get('adminSession');
  return adminSession?.value === 'true';
}

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get dashboard statistics
    const [
      totalProducts,
      activeProducts,
      totalCategories,
      totalContacts,
      newContacts,
      totalUsers
    ] = await Promise.all([
      ProductModel.count({}),
      ProductModel.count({ isActive: true }),
      CategoryModel.count({}),
      ContactModel.count({}),
      ContactModel.count({ status: 'new' }),
      UserModel.count({})
    ]);

    // Get recent activities (last 10 contacts)
    const recentContacts = await ContactModel.findMany({}, { limit: 10, sort: { createdAt: -1 } });

    const dashboardData = {
      stats: {
        totalProducts,
        activeProducts,
        inactiveProducts: totalProducts - activeProducts,
        totalCategories,
        totalContacts,
        newContacts,
        repliedContacts: totalContacts - newContacts,
        totalUsers
      },
      recentContacts: recentContacts.map(contact => ({
        id: contact._id?.toString(),
        name: contact.name,
        email: contact.email,
        subject: contact.subject,
        status: contact.status,
        createdAt: contact.createdAt
      }))
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
