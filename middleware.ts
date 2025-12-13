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

  // Vercel handles HTTPS automatically, so remove manual redirect
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'], // Apply to all API routes
}