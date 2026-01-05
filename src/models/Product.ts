import { getSupabase, IProduct, dbToModel, isValidUUID } from '../lib/db';

export class ProductModel {
  static table = 'products';

  // Create a new product
  static async create(productData: Omit<IProduct, '_id' | 'id' | 'createdAt' | 'updatedAt'>): Promise<IProduct> {
    const supabase = getSupabase();
    
    const { data, error } = await supabase
      .from(this.table)
      .insert({
        name: productData.name,
        slug: productData.slug,
        short_description: productData.shortDescription,
        long_description: productData.longDescription,
        card_image: productData.cardImage,
        detail_images: productData.detailImages || [],
        short_features: productData.shortFeatures || [],
        specifications: productData.specifications || {},
        reviews_data: productData.reviewsData || {},
        catalog_file: productData.catalogFile,
        category_id: productData.categoryId,
        subcategory_id: productData.subcategoryId,
        is_active: productData.isActive ?? true,
        view_count: productData.viewCount || 0
      })
      .select()
      .single();

    if (error) throw error;
    return dbToModel<IProduct>(data);
  }

  // Find product by ID
  static async findById(id: string): Promise<IProduct | null> {
    if (!isValidUUID(id)) return null;
    
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return dbToModel<IProduct>(data);
  }

  // Find product by slug
  static async findBySlug(slug: string): Promise<IProduct | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !data) return null;
    return dbToModel<IProduct>(data);
  }

  // Find product by ID or slug
  static async findByIdOrSlug(identifier: string): Promise<IProduct | null> {
    // Try to find by slug first
    let product = await this.findBySlug(identifier);
    
    // If not found and identifier is a valid UUID, try finding by ID
    if (!product && isValidUUID(identifier)) {
      product = await this.findById(identifier);
    }
    
    return product;
  }

  // Find all products
  static async findMany(filter: Record<string, unknown> = {}, options: { sort?: Record<string, number>; limit?: number } = {}): Promise<IProduct[]> {
    const supabase = getSupabase();
    let query = supabase.from(this.table).select('*');
    
    // Apply filters
    if (filter.isActive !== undefined) {
      query = query.eq('is_active', filter.isActive);
    }
    if (filter.categoryId || filter.category_id) {
      query = query.eq('category_id', filter.categoryId || filter.category_id);
    }
    if (filter.subcategoryId || filter.subcategory_id) {
      query = query.eq('subcategory_id', filter.subcategoryId || filter.subcategory_id);
    }
    
    // Apply sorting
    if (options.sort) {
      const sortKey = Object.keys(options.sort)[0];
      const sortOrder = options.sort[sortKey] === -1 ? false : true;
      const snakeKey = sortKey.replace(/([A-Z])/g, '_$1').toLowerCase();
      query = query.order(snakeKey, { ascending: sortOrder });
    }
    
    // Apply limit
    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(row => dbToModel<IProduct>(row));
  }

  // Find active products
  static async findActive(options: { sort?: Record<string, number>; limit?: number } = {}): Promise<IProduct[]> {
    return this.findMany({ isActive: true }, options);
  }

  // Find products by category
  static async findByCategory(categoryId: string, options: Record<string, unknown> = {}): Promise<IProduct[]> {
    if (!isValidUUID(categoryId)) return [];
    return this.findMany({ categoryId, isActive: true }, options as { sort?: Record<string, number>; limit?: number });
  }

  // Find products by subcategory
  static async findBySubcategory(subcategoryId: string, options: Record<string, unknown> = {}): Promise<IProduct[]> {
    if (!isValidUUID(subcategoryId)) return [];
    return this.findMany({ subcategoryId, isActive: true }, options as { sort?: Record<string, number>; limit?: number });
  }

  // Search products by name or description
  static async search(searchTerm: string, options: { limit?: number } = {}): Promise<IProduct[]> {
    const supabase = getSupabase();
    let query = supabase
      .from(this.table)
      .select('*')
      .eq('is_active', true)
      .or(`name.ilike.%${searchTerm}%,short_description.ilike.%${searchTerm}%,long_description.ilike.%${searchTerm}%`);
    
    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(row => dbToModel<IProduct>(row));
  }

  // Update product by ID
  static async updateById(id: string, updateData: Partial<IProduct>): Promise<IProduct | null> {
    if (!isValidUUID(id)) return null;
    
    const supabase = getSupabase();
    
    // Convert camelCase to snake_case for update
    const dbData: Record<string, unknown> = {};
    if (updateData.name !== undefined) dbData.name = updateData.name;
    if (updateData.slug !== undefined) dbData.slug = updateData.slug;
    if (updateData.shortDescription !== undefined) dbData.short_description = updateData.shortDescription;
    if (updateData.longDescription !== undefined) dbData.long_description = updateData.longDescription;
    if (updateData.cardImage !== undefined) dbData.card_image = updateData.cardImage;
    if (updateData.detailImages !== undefined) dbData.detail_images = updateData.detailImages;
    if (updateData.shortFeatures !== undefined) dbData.short_features = updateData.shortFeatures;
    if (updateData.specifications !== undefined) dbData.specifications = updateData.specifications;
    if (updateData.reviewsData !== undefined) dbData.reviews_data = updateData.reviewsData;
    if (updateData.catalogFile !== undefined) dbData.catalog_file = updateData.catalogFile;
    if (updateData.categoryId !== undefined) dbData.category_id = updateData.categoryId;
    if (updateData.subcategoryId !== undefined) dbData.subcategory_id = updateData.subcategoryId;
    if (updateData.isActive !== undefined) dbData.is_active = updateData.isActive;
    if (updateData.viewCount !== undefined) dbData.view_count = updateData.viewCount;

    const { data, error } = await supabase
      .from(this.table)
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) return null;
    return dbToModel<IProduct>(data);
  }

  // Increment view count
  static async incrementViewCount(id: string): Promise<boolean> {
    if (!isValidUUID(id)) return false;
    
    const supabase = getSupabase();
    
    // First get current view count
    const { data: current } = await supabase
      .from(this.table)
      .select('view_count')
      .eq('id', id)
      .single();
    
    if (!current) return false;
    
    const { error } = await supabase
      .from(this.table)
      .update({ view_count: (current.view_count || 0) + 1 })
      .eq('id', id);

    return !error;
  }

  // Delete product by ID
  static async deleteById(id: string): Promise<boolean> {
    if (!isValidUUID(id)) return false;
    
    const supabase = getSupabase();
    const { error } = await supabase
      .from(this.table)
      .delete()
      .eq('id', id);

    return !error;
  }

  // Count products
  static async count(filter: Record<string, unknown> = {}): Promise<number> {
    const supabase = getSupabase();
    let query = supabase.from(this.table).select('*', { count: 'exact', head: true });
    
    if (filter.isActive !== undefined) {
      query = query.eq('is_active', filter.isActive);
    }
    
    const { count, error } = await query;
    if (error) throw error;
    return count || 0;
  }

  // Get featured products (most viewed)
  static async getFeatured(limit: number = 10): Promise<IProduct[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('is_active', true)
      .order('view_count', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map(row => dbToModel<IProduct>(row));
  }

  // Get latest products
  static async getLatest(limit: number = 10): Promise<IProduct[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map(row => dbToModel<IProduct>(row));
  }
}

export default ProductModel;