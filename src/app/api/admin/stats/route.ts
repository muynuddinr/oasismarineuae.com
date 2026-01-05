import { NextResponse, NextRequest } from 'next/server';
import { CategoryModel } from '@/models/Category';
import { SubcategoryModel } from '@/models/Subcategory';
import { ProductModel } from '@/models/Product';
import { ContactModel } from '@/models/Contact';
import { ContactSubmissionModel } from '@/models/ContactSubmission';
import { requireAdminAuth } from '@/middleware/adminAuth';
import { logAdminActionFromRequest } from '@/middleware/auditLog';

interface RecentActivity {
  type: string;
  message: string;
  time: string;
}

export async function GET(request: NextRequest) {
  // 🔒 AUTHENTICATION CHECK
  const authError = await requireAdminAuth(request);
  if (authError) {
    logAdminActionFromRequest(request, 'GET_STATS_UNAUTHORIZED', false, null, 'Unauthorized attempt');
    return authError;
  }

  try {
    console.log('Fetching admin stats...');

    // Get all statistics from database
    const [
      totalNavbarCategories,
      totalNavbarSubcategories,
      totalProducts,
      totalContactDetails,
      totalProductEnquiries,
      recentContacts,
      recentProducts
    ] = await Promise.all([
      CategoryModel.count(),
      SubcategoryModel.count(),
      ProductModel.count(),
      ContactSubmissionModel.count(),
      ContactModel.count(),
      ContactModel.findMany({}, { sort: { createdAt: -1 }, limit: 5 }),
      ProductModel.findMany({}, { sort: { createdAt: -1 }, limit: 5 })
    ]);

    // Calculate trends (last 30 days vs previous 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const [
      contactsLast30Days,
      contactsPrevious30Days
    ] = await Promise.all([
      ContactModel.count({ createdAt: { $gte: thirtyDaysAgo } }),
      ContactModel.count({ createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } })
    ]);

    const contactsTrend = contactsPrevious30Days > 0 
      ? Math.round(((contactsLast30Days - contactsPrevious30Days) / contactsPrevious30Days) * 100)
      : contactsLast30Days > 0 ? 100 : 0;

    // Combine, sort, then format recent activities
    const allActivities = [
      ...recentContacts.map((contact) => ({
        type: 'order',
        message: `New inquiry: ${contact.productName ?? contact.subject}`,
        createdAt: contact.createdAt
      })),
      ...recentProducts.map((product) => ({
        type: 'product',
        message: `New product added: ${product.name}`,
        createdAt: product.createdAt
      }))
    ];

    allActivities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const recentActivities: RecentActivity[] = allActivities.slice(0, 5).map(activity => ({
      type: activity.type,
      message: activity.message,
      time: formatTimeAgo(activity.createdAt)
    }));

    const statsData = {
      stats: {
        navbarCategories: totalNavbarCategories,
        navbarSubcategories: totalNavbarSubcategories,
        totalProducts: totalProducts,
        contactDetails: totalContactDetails,
        productEnquiries: totalProductEnquiries,
        totalRevenue: 45280,
        totalOrders: totalContactDetails + totalProductEnquiries,
        pageViews: 12567
      },
      trends: {
        contactsTrend: contactsTrend > 0 ? `+${contactsTrend}%` : `${contactsTrend}%`,
        productsTrend: '+5.2%',
        revenueTrend: '+12.5%'
      },
      chartData: [
        { month: 'Jan', sales: 4200, orders: Math.floor(totalProductEnquiries * 0.20) },
        { month: 'Feb', sales: 3800, orders: Math.floor(totalProductEnquiries * 0.18) },
        { month: 'Mar', sales: 5100, orders: Math.floor(totalProductEnquiries * 0.25) },
        { month: 'Apr', sales: 4600, orders: Math.floor(totalProductEnquiries * 0.22) },
        { month: 'May', sales: 5800, orders: Math.floor(totalProductEnquiries * 0.28) },
        { month: 'Jun', sales: 6200, orders: Math.floor(totalProductEnquiries * 0.30) }
      ],
      recentActivities: recentActivities,
      topProducts: [
        { name: 'Marine Rubber Mats', sales: Math.floor(totalProducts * 0.25), revenue: '$3,750' },
        { name: 'Marine LED Lights', sales: Math.floor(totalProducts * 0.20), revenue: '$1,568' },
        { name: 'Safety Equipment', sales: Math.floor(totalProducts * 0.18), revenue: '$3,492' },
        { name: 'Navigation Tools', sales: Math.floor(totalProducts * 0.15), revenue: '$4,860' },
        { name: 'Marine Accessories', sales: Math.floor(totalProducts * 0.12), revenue: '$1,260' }
      ]
    };

    console.log('Stats data:', statsData);
    return NextResponse.json(statsData);

  } catch (error) {
    console.error('Error fetching stats data:', error);
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json(
      { error: 'Failed to fetch stats data', details: errorMessage },
      { status: 500 }
    );
  }
}

// Helper function (no changes needed)
function formatTimeAgo(date: Date | string): string {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
}