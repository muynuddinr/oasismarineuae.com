// Authentication middleware for admin routes
// Checks for auth-token JWT and enforces security policies

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

async function checkAdminAuth(req: NextRequest) {
  try {
    const authToken = req.cookies.get('auth-token')?.value;
    
    if (!authToken) {
      // Fallback to legacy adminSession
      const adminSession = req.cookies.get('adminSession');
      return adminSession?.value === 'true';
    }

    // Verify JWT token
    const decoded = verifyToken(authToken);
    return decoded && decoded.role === 'admin';
  } catch (error) {
    console.error('Token verification failed:', error);
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname, protocol, host } = req.nextUrl;

  // 1. HTTPS Enforcement in production
  if (process.env.NODE_ENV === 'production' && protocol !== 'https:') {
    const url = req.nextUrl.clone();
    url.protocol = 'https:';
    return NextResponse.redirect(url);
  }

  // 2. CORS Headers - Allow requests from trusted origins
  const response = NextResponse.next();
  const origin = req.headers.get('origin');
  
  // Whitelist allowed origins
  const allowedOrigins = [
    'https://oasismarineuae.com',
    'https://www.oasismarineuae.com',
    'http://localhost:3000',
    'http://localhost:3001',
  ];

  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Max-Age', '86400');
  }

  // 3. Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: response.headers,
    });
  }

  // 4. Security Headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=()'
  );

  // 5. Protect admin API routes
  if (pathname.startsWith('/api/admin')) {
    const isAdmin = await checkAdminAuth(req);
    if (!isAdmin) {
      return NextResponse.json(
        { 
          error: 'Unauthorized. Admin access required.',
          timestamp: new Date().toISOString(),
        },
        { 
          status: 401,
          headers: response.headers,
        }
      );
    }
  }

  // 6. Protect admin dashboard routes
  if (pathname.startsWith('/admin') && !pathname.startsWith('/api/admin')) {
    const authToken = req.cookies.get('auth-token')?.value;
    const adminSession = req.cookies.get('adminSession')?.value;

    if (!authToken && !adminSession) {
      const loginUrl = new URL('/admin', req.nextUrl.origin);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/api/:path*',
    '/admin/:path*',
  ],
}
