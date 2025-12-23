import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ProductModel } from '@/models/Product';
import { CategoryModel } from '@/models/Category';
import { ContactModel } from '@/models/Contact';
import { UserModel } from '@/models/User';
import { requireAdminAuth, getClientIP } from '@/middleware/adminAuth';
import { logAdminActionFromRequest } from '@/middleware/auditLog';
import winston from 'winston';

// Setup Winston logger
const logger = winston.createLogger({
  level: 'info',
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/security.log' }),
  ],
});

export async function GET(request: NextRequest) {
  // 🔒 AUTHENTICATION CHECK
  const authError = await requireAdminAuth(request);
  if (authError) {
    logAdminActionFromRequest(request, 'GET_DASHBOARD_UNAUTHORIZED', false, null, 'Unauthorized attempt');
    return authError;
  }

  try {
    const clientIP = getClientIP(request);
    logger.info(`GET /api/admin/dashboard from ${clientIP}`);

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

    logAdminActionFromRequest(request, 'GET_DASHBOARD', true, dashboardData);
    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Dashboard API error:', error);
    logAdminActionFromRequest(request, 'GET_DASHBOARD', false, null, error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
