// Authentication middleware for admin routes
// Checks for adminSession cookie and enforces security

import { NextRequest, NextResponse } from 'next/server';

async function checkAdminAuth(req: NextRequest) {
  const adminSession = req.cookies.get('adminSession');
  return adminSession?.value === 'true';
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect admin routes
  if (pathname.startsWith('/api/admin')) {
    const isAdmin = await checkAdminAuth(req);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }
  }

  // Enforce HTTPS in production (optional, but recommended)
  if (process.env.NODE_ENV === 'production' && !req.url.startsWith('https://')) {
    return NextResponse.redirect(new URL(req.url.replace('http://', 'https://')));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'], // Apply to all API routes
}