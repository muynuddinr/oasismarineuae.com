import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ContactModel } from '@/models/Contact';
import DashboardStatsModel from '@/models/DashboardStats';
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

    // Get dashboard stats from dedicated table
    let stats = await DashboardStatsModel.get();
    
    // If no stats exist, recalculate from tables
    if (!stats) {
      stats = await DashboardStatsModel.recalculate();
    }

    // Get recent contacts for activity feed
    const [recentContacts, newContacts] = await Promise.all([
      ContactModel.findMany({}, { limit: 10, sort: { createdAt: -1 } }),
      ContactModel.count({ status: 'new' })
    ]);

    const dashboardData = {
      // Top-level keys for easy access
      products: stats?.total_products ?? 0,
      categories: stats?.total_categories ?? 0,
      subcategories: stats?.total_subcategories ?? 0,
      contacts: stats?.total_contacts ?? 0,
      enquiries: stats?.total_enquiries ?? 0,
      // Detailed stats
      stats: {
        totalProducts: stats?.total_products ?? 0,
        totalCategories: stats?.total_categories ?? 0,
        totalSubcategories: stats?.total_subcategories ?? 0,
        totalContacts: stats?.total_contacts ?? 0,
        totalEnquiries: stats?.total_enquiries ?? 0,
        newContacts,
      },
      recentContacts: recentContacts.map(contact => ({
        id: contact._id?.toString(),
        name: contact.name,
        email: contact.email,
        subject: contact.subject,
        status: contact.status,
        createdAt: contact.createdAt
      })),
      lastUpdated: stats?.updated_at
    };

    logAdminActionFromRequest(request, 'GET_DASHBOARD', true, dashboardData);
    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Dashboard API error:', error);
    logAdminActionFromRequest(request, 'GET_DASHBOARD', false, null, error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
