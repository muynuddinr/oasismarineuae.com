/**
 * Create Supabase Tables Script
 * This script creates all required tables in Supabase using the REST API
 * Run: npx tsx scripts/create-supabase-tables.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mwfdlskkkgmzmqcawcji.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13ZmRsc2tra2dtem1xY2F3Y2ppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzU4MjEyNywiZXhwIjoyMDgzMTU4MTI3fQ.MKgMuZpUJYVoWacuaQ85v45c0cdRjNxSQJNMQ8mWoV4';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const createTablesSQL = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mongo_id TEXT UNIQUE,
    name TEXT,
    email TEXT UNIQUE,
    email_verified TIMESTAMPTZ,
    image TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CATEGORIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mongo_id TEXT UNIQUE,
    name TEXT NOT NULL,
    href TEXT NOT NULL,
    is_category BOOLEAN DEFAULT true,
    visible BOOLEAN DEFAULT true,
    "order" INTEGER DEFAULT 0,
    image TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SUBCATEGORIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS subcategories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mongo_id TEXT UNIQUE,
    name TEXT NOT NULL,
    href TEXT NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    visible BOOLEAN DEFAULT true,
    "order" INTEGER DEFAULT 0,
    image TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PRODUCTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mongo_id TEXT UNIQUE,
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    short_description TEXT,
    long_description TEXT,
    card_image TEXT,
    detail_images TEXT[] DEFAULT '{}',
    short_features TEXT[] DEFAULT '{}',
    specifications JSONB DEFAULT '{}',
    reviews_data JSONB DEFAULT '{}',
    catalog_file TEXT,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    subcategory_id UUID REFERENCES subcategories(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CONTACTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mongo_id TEXT UNIQUE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name TEXT,
    product_image TEXT,
    enquiry_type TEXT DEFAULT 'general' CHECK (enquiry_type IN ('product', 'general', 'support')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    replied_at TIMESTAMPTZ
);

-- =====================================================
-- CONTACT SUBMISSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS contact_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mongo_id TEXT UNIQUE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    source TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    replied_at TIMESTAMPTZ
);
`;

async function createTables() {
  console.log('🚀 Creating Supabase tables...\n');
  
  // Use the Supabase Management API or direct PostgreSQL connection
  // Since we're using the client SDK, we need to use the sql function
  
  try {
    // Try using rpc to execute raw SQL (requires a function to be set up)
    // Alternative: Use fetch to call the REST API directly
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({ sql: createTablesSQL })
    });
    
    if (!response.ok) {
      console.log('⚠️  RPC method not available. Please run the SQL manually.\n');
      console.log('📋 Steps to create tables:');
      console.log('1. Go to: https://supabase.com/dashboard/project/mwfdlskkkgmzmqcawcji/sql/new');
      console.log('2. Copy the SQL from: supabase-schema.sql');
      console.log('3. Paste and click "Run"\n');
      console.log('Alternatively, here is the SQL to run:\n');
      console.log('='.repeat(60));
      console.log(createTablesSQL);
      console.log('='.repeat(60));
    } else {
      console.log('✅ Tables created successfully!');
    }
  } catch (error) {
    console.log('⚠️  Could not create tables via API.\n');
    console.log('📋 Please run this SQL manually in Supabase SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/mwfdlskkkgmzmqcawcji/sql/new\n');
  }
}

createTables();
