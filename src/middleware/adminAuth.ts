/**
 * Admin Authentication Middleware
 * Provides secure authentication checks for admin routes
 * Supports both NextAuth sessions and Authorization Bearer tokens
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { cookies } from 'next/headers';

/**
 * Check if request has valid admin authentication
 * Supports multiple authentication methods:
 * 1. Authorization Bearer token (for Postman/API clients)
 * 2. NextAuth session (for web UI)
 * 3. adminSession cookie (legacy, less secure)
 */
export async function checkAdminAuth(request: NextRequest): Promise<boolean> {
  try {
    // Method 1: Check Authorization header (RECOMMENDED for Postman)
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Verify token matches NEXTAUTH_SECRET
      if (token === process.env.NEXTAUTH_SECRET) {
        return true;
      }
    }

    // Method 2: Check NextAuth session (for web UI)
    try {
      const session = await getServerSession(authOptions);
      if (session && session.user) {
        // Optional: Add role-based check here
        // if ((session.user as any).role === 'admin') return true;
        return true;
      }
    } catch (error) {
      console.error('Session check failed:', error);
    }

    // Method 3: Check adminSession cookie (legacy)
    const cookieStore = await cookies();
    const adminSession = cookieStore.get('adminSession');
    if (adminSession?.value === 'true') {
      return true;
    }

    return false;
  } catch (error) {
    console.error('Admin auth check error:', error);
    return false;
  }
}

/**
 * Middleware function to protect admin routes
 * Returns error response if not authenticated, null if authorized
 */
export async function requireAdminAuth(
  request: NextRequest
): Promise<NextResponse | null> {
  const isAdmin = await checkAdminAuth(request);

  if (!isAdmin) {
    return NextResponse.json(
      {
        error: 'Unauthorized',
        message: 'Admin authentication required',
        timestamp: new Date().toISOString(),
      },
      {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Bearer realm="Admin API"',
        },
      }
    );
  }

  return null; // Allow request to proceed
}

/**
 * Helper to get IP address from request
 */
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

/**
 * Helper to get user agent from request
 */
export function getUserAgent(request: NextRequest): string {
  return request.headers.get('user-agent') || 'unknown';
}
