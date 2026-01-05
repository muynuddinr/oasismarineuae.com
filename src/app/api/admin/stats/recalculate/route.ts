import { NextRequest, NextResponse } from 'next/server';
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

// POST - Recalculate all stats from tables
export async function POST(request: NextRequest) {
  // 🔒 AUTHENTICATION CHECK
  const authError = await requireAdminAuth(request);
  if (authError) {
    logAdminActionFromRequest(request, 'RECALCULATE_STATS_UNAUTHORIZED', false, null, 'Unauthorized attempt');
    return authError;
  }

  try {
    const clientIP = getClientIP(request);
    logger.info(`POST /api/admin/stats/recalculate from ${clientIP}`);

    const stats = await DashboardStatsModel.recalculate();

    if (!stats) {
      return NextResponse.json({ error: 'Failed to recalculate stats' }, { status: 500 });
    }

    logAdminActionFromRequest(request, 'RECALCULATE_STATS', true, stats);
    return NextResponse.json({ 
      success: true, 
      message: 'Stats recalculated successfully',
      stats 
    });
  } catch (error) {
    console.error('Recalculate stats error:', error);
    logAdminActionFromRequest(request, 'RECALCULATE_STATS', false, null, error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Get current stats
export async function GET(request: NextRequest) {
  // 🔒 AUTHENTICATION CHECK
  const authError = await requireAdminAuth(request);
  if (authError) {
    return authError;
  }

  try {
    let stats = await DashboardStatsModel.get();
    
    // If no stats exist, recalculate
    if (!stats) {
      stats = await DashboardStatsModel.recalculate();
    }

    return NextResponse.json({ 
      success: true, 
      stats 
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
