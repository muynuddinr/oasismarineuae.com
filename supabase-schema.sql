-- Supabase Schema for Oasis Marine UAE
-- Run this in Supabase SQL Editor to create all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ADMINS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);

-- =====================================================
-- CATEGORIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mongo_id TEXT UNIQUE, -- Store original MongoDB _id for reference
    name TEXT NOT NULL,
    href TEXT NOT NULL,
    is_category BOOLEAN DEFAULT true,
    visible BOOLEAN DEFAULT true,
    "order" INTEGER DEFAULT 0,
    image TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for href lookups
CREATE INDEX IF NOT EXISTS idx_categories_href ON categories(href);
CREATE INDEX IF NOT EXISTS idx_categories_visible ON categories(visible);
CREATE INDEX IF NOT EXISTS idx_categories_mongo_id ON categories(mongo_id);

-- =====================================================
-- SUBCATEGORIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS subcategories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mongo_id TEXT UNIQUE, -- Store original MongoDB _id for reference
    name TEXT NOT NULL,
    href TEXT NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    visible BOOLEAN DEFAULT true,
    "order" INTEGER DEFAULT 0,
    image TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for category lookups
CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_href ON subcategories(href);
CREATE INDEX IF NOT EXISTS idx_subcategories_mongo_id ON subcategories(mongo_id);

-- =====================================================
-- PRODUCTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mongo_id TEXT UNIQUE, -- Store original MongoDB _id for reference
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

-- Indexes for product queries
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_subcategory_id ON products(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_mongo_id ON products(mongo_id);

-- Full text search on products
CREATE INDEX IF NOT EXISTS idx_products_search ON products USING gin(to_tsvector('english', name || ' ' || COALESCE(short_description, '') || ' ' || COALESCE(long_description, '')));

-- =====================================================
-- CONTACTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mongo_id TEXT UNIQUE, -- Store original MongoDB _id for reference
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

-- Indexes for contact queries
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_mongo_id ON contacts(mongo_id);

-- =====================================================
-- CONTACT SUBMISSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS contact_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mongo_id TEXT UNIQUE, -- Store original MongoDB _id for reference
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

-- Indexes for submission queries
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_email ON contact_submissions(email);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_mongo_id ON contact_submissions(mongo_id);

-- =====================================================
-- AUTO-UPDATE TIMESTAMPS TRIGGER
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subcategories_updated_at ON subcategories;
CREATE TRIGGER update_subcategories_updated_at BEFORE UPDATE ON subcategories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_contacts_updated_at ON contacts;
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_contact_submissions_updated_at ON contact_submissions;
CREATE TRIGGER update_contact_submissions_updated_at BEFORE UPDATE ON contact_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Public read access for categories, subcategories, and products
CREATE POLICY "Allow public read access to categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow public read access to subcategories" ON subcategories FOR SELECT USING (true);
CREATE POLICY "Allow public read access to products" ON products FOR SELECT USING (is_active = true);

-- Service role has full access (for API routes)
CREATE POLICY "Service role has full access to users" ON users FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role has full access to categories" ON categories FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role has full access to subcategories" ON subcategories FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role has full access to products" ON products FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role has full access to contacts" ON contacts FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role has full access to contact_submissions" ON contact_submissions FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to search products
CREATE OR REPLACE FUNCTION search_products(search_term TEXT)
RETURNS SETOF products AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM products
    WHERE is_active = true
    AND (
        name ILIKE '%' || search_term || '%'
        OR short_description ILIKE '%' || search_term || '%'
        OR long_description ILIKE '%' || search_term || '%'
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get products by category
CREATE OR REPLACE FUNCTION get_products_by_category(cat_id UUID)
RETURNS SETOF products AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM products WHERE category_id = cat_id AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Function to get products by subcategory
CREATE OR REPLACE FUNCTION get_products_by_subcategory(subcat_id UUID)
RETURNS SETOF products AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM products WHERE subcategory_id = subcat_id AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SEED DATA: Insert default admin
-- =====================================================
-- Password: oasis@password (bcrypt hashed)
INSERT INTO admins (email, password_hash, name) 
VALUES (
    'admin@oasismarineuae.com', 
    '$2b$10$0xB/3ePNXLoE1kcYvoOrceNd5XPf68C6MYTaqwFCYMGYZ8XSrkB7K', 
    'Administrator'
)
ON CONFLICT (email) DO NOTHING;

SELECT 'Schema created successfully!' as status;
