/**
 * Admin Login API Endpoint
 * Authenticates admin users and generates JWT tokens
 * Stored in HTTP-only, secure cookies
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateToken, ADMIN_USERNAME, ADMIN_PASSWORD_HASH, verifyPassword } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rateLimit'
import bcrypt from 'bcryptjs'

// For development: hash of 'Admin@uae123'
const DEFAULT_PASSWORD_HASH = '$2a$10$YIjlrTvUoAG0gVXlVUqYoOU.8CTPL1ww9gZEJuHZgOmqV7L0GhEAm'

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimitKey = `login:${ip}`

    // Check rate limiting (5 attempts per 15 minutes)
    if (!checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { username, password } = body

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    // Check username
    if (username !== ADMIN_USERNAME) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Use default hash if ADMIN_PASSWORD_HASH is not set
    const passwordHash = ADMIN_PASSWORD_HASH || DEFAULT_PASSWORD_HASH

    // Verify password
    const isPasswordValid = await verifyPassword(password, passwordHash)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Generate JWT token
    const token = generateToken({
      username,
      role: 'admin',
      iat: Date.now(),
    })

    // Create response with secure, HTTP-only cookie
    const response = NextResponse.json(
      { 
        success: true, 
        message: 'Login successful',
        user: { username, role: 'admin' }
      },
      { status: 200 }
    )

    // Set HTTP-only, secure cookie
    response.cookies.set({
      name: 'auth-token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    })

    // Also set admin session for backward compatibility
    response.cookies.set({
      name: 'adminSession',
      value: 'true',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    })

    response.cookies.set({
      name: 'adminUser',
      value: username,
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Only allow POST method
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}
