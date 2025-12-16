import { NextRequest, NextResponse } from 'next/server';
import { UserModel } from '@/models/User';
import { cookies } from 'next/headers';
import { z } from 'zod';
import winston from 'winston';

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
  try {
    logger.info(`GET /api/admin/users from ${request.ip}`);

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
  try {
    logger.info(`DELETE /api/admin/users from ${request.ip}`);

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
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    logger.info(`PATCH /api/admin/users from ${request.ip}`);

    const body = await request.json();

    // Validate input
    const validated = userUpdateSchema.safeParse(body);
    if (!validated.success) {
      logger.warn('Invalid user update data:', validated.error.errors);
      return NextResponse.json(
        { error: 'Invalid user update data' },
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

    switch (action) {
      case 'verify':
        updateData.emailVerified = new Date();
        break;
      case 'unverify':
        updateData.emailVerified = null;
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    const updatedUser = await UserModel.updateById(userId, updateData);

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
