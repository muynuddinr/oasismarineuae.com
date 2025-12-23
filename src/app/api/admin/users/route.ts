import { NextRequest, NextResponse } from 'next/server';
import { UserModel } from '@/models/User';
import { cookies } from 'next/headers';
import { z } from 'zod';
import winston from 'winston';
import { requireAdminAuth } from '@/middleware/adminAuth';
import { logAdminActionFromRequest } from '@/middleware/auditLog';

// Setup Winston logger
const logger = winston.createLogger({
  level: 'info',
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/security.log' }),
  ],
});

// Validation schemas
const userUpdateSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  role: z.enum(['user', 'admin']).optional(),
});

export async function GET(request: NextRequest) {
  // 🔒 AUTHENTICATION CHECK
  const authError = await requireAdminAuth(request);
  if (authError) {
    logAdminActionFromRequest(request, 'GET_USERS_UNAUTHORIZED', false, null, 'Unauthorized attempt');
    return authError;
  }

  try {
    const clientIP = require('@/middleware/adminAuth').getClientIP(request);
    logger.info(`GET /api/admin/users from ${clientIP}`);

    // Get search and filter parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const verified = searchParams.get('verified') || '';

    // Build filter for MongoDB query
    const filter: any = {};

    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Email verified filter
    if (verified === 'verified') {
      filter.emailVerified = { $ne: null };
    } else if (verified === 'unverified') {
      filter.emailVerified = null;
    }

    // Fetch users from database
    const users = await UserModel.findMany(filter, { sort: { createdAt: -1 } });

    // Transform data for frontend
    const transformedUsers = users.map((user) => {
      // Check if user is verified
      const isVerified = user.emailVerified !== null;
      
      // Determine status based on recent activity (simplified)
      const now = new Date();
      const recentActivity = (now.getTime() - (user.updatedAt || user.createdAt).getTime()) < (7 * 24 * 60 * 60 * 1000); // 7 days
      const status = recentActivity ? 'active' : 'inactive';

      return {
        id: user._id?.toString() || '',
        name: user.name || 'No Name',
        email: user.email,
        image: user.image,
        joinDate: user.createdAt.toISOString(),
        lastActivity: (user.updatedAt || user.createdAt).toISOString(),
        verified: isVerified,
        status: status as 'active' | 'inactive',
        sessionsCount: 0, // Simplified since we don't track sessions in our model
        accountsCount: 0  // Simplified since we don't track accounts in our model
      };
    });

    return NextResponse.json({
      users: transformedUsers,
      total: transformedUsers.length
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  // 🔒 AUTHENTICATION CHECK
  const authError = await requireAdminAuth(request);
  if (authError) {
    logAdminActionFromRequest(request, 'DELETE_USER_UNAUTHORIZED', false, null, 'Unauthorized attempt');
    return authError;
  }

  try {
    const clientIP = require('@/middleware/adminAuth').getClientIP(request);
    logger.info(`DELETE /api/admin/users from ${clientIP}`);

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Delete user from database
    const deleted = await UserModel.deleteById(userId);

    if (!deleted) {
      logAdminActionFromRequest(request, 'DELETE_USER_NOT_FOUND', false, { userId }, 'User not found');
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 📝 LOG SUCCESS
    logAdminActionFromRequest(request, 'DELETE_USER_SUCCESS', true, { userId });

    return NextResponse.json({
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    logAdminActionFromRequest(request, 'DELETE_USER_ERROR', false, null, error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { getClientIP } = require('@/middleware/adminAuth');
    const clientIP = getClientIP(request);
    logger.info(`PATCH /api/admin/users from ${clientIP}`);

    const body = await request.json();

    // Validate input
    const validated = userUpdateSchema.safeParse(body);
    if (!validated.success) {
      logger.warn('Invalid user update data:', validated.error.format());
      return NextResponse.json(
        { error: 'Invalid user data' },
        { status: 400 }
      );
    }

    const { id, name, email, role } = validated.data;

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    let updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;

    const updatedUser = await UserModel.updateById(id, updateData);

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'User updated successfully',
      user: {
        id: updatedUser._id?.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        emailVerified: updatedUser.emailVerified,
        updatedAt: updatedUser.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
