import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { getSupabase } from './db'

// Get JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'your-secret-key-change-in-production'
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '24h'

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

/**
 * Compare password with hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Generate JWT token
 */
export function generateToken(payload: object): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRATION as string | number,
  } as jwt.SignOptions)
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): { email: string; role: string; iat: number } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { email: string; role: string; iat: number }
  } catch {
    return null
  }
}

/**
 * Admin model for database operations
 */
export const AdminModel = {
  table: 'admins',

  // Find admin by email
  async findByEmail(email: string) {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('email', email.toLowerCase())
      .single()

    if (error || !data) return null
    return {
      id: data.id,
      email: data.email,
      passwordHash: data.password_hash,
      name: data.name,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  },

  // Create a new admin
  async create(email: string, password: string, name?: string) {
    const supabase = getSupabase()
    const passwordHash = await hashPassword(password)
    
    const { data, error } = await supabase
      .from(this.table)
      .insert({
        email: email.toLowerCase(),
        password_hash: passwordHash,
        name: name || 'Admin'
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Verify admin credentials
  async verifyCredentials(email: string, password: string) {
    const admin = await this.findByEmail(email)
    if (!admin) return null

    const isValid = await verifyPassword(password, admin.passwordHash)
    if (!isValid) return null

    return admin
  },

  // Check if any admin exists
  async exists() {
    const supabase = getSupabase()
    const { count, error } = await supabase
      .from(this.table)
      .select('*', { count: 'exact', head: true })

    if (error) return false
    return (count || 0) > 0
  }
}
