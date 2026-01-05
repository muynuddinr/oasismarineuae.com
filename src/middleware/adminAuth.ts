/**
 * Admin Authentication Middleware
 * Provides secure authentication checks for admin routes
 * Uses JWT tokens stored in cookies
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

/**
 * Check if request has valid admin authentication
 * Supports:
 * 1. JWT token in auth-token cookie (PRIMARY - secure)
 * 2. Authorization Bearer token (for API clients)
 */
export async function checkAdminAuth(request: NextRequest): Promise<boolean> {
  try {
    // Method 1: Check JWT in auth-token cookie (PRIMARY)
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token')?.value;
    
    if (authToken) {
      const decoded = verifyToken(authToken);
      if (decoded && decoded.role === 'admin') {
        return true;
      }
    }

    // Method 2: Check Authorization Bearer token (for API clients)
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      if (decoded && decoded.role === 'admin') {
        return true;
      }
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
