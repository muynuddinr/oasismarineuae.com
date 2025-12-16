import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ProductModel } from '@/models/Product';
import { CategoryModel } from '@/models/Category';
import { ContactModel } from '@/models/Contact';
import { UserModel } from '@/models/User';
import bcrypt from 'bcrypt';
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

// Login schema
const loginSchema = z.object({
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    logger.info(`POST /api/admin/dashboard (login) from ${request.ip}`);

    const body = await request.json();
    const validated = loginSchema.safeParse(body);
    if (!validated.success) {
      logger.warn('Invalid login data');
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { password } = validated.data;

    // Check against hashed password (assume env var for simplicity)
    const hashedPassword = process.env.ADMIN_PASSWORD_HASH || await bcrypt.hash('defaultpassword', 10); // Change this
    const isValid = await bcrypt.compare(password, hashedPassword);

    if (!isValid) {
      logger.warn('Failed login attempt');
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Set secure cookie
    const cookieStore = await cookies();
    cookieStore.set('adminSession', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 1 day
    });

    logger.info('Admin login successful');
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    logger.info(`GET /api/admin/dashboard from ${request.ip}`);

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
