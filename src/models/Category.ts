import { getSupabase, ICategory, dbToModel, isValidUUID } from '../lib/db';

export class CategoryModel {
  static table = 'categories';

  // Create a new category
  static async create(categoryData: Omit<ICategory, '_id' | 'id' | 'createdAt' | 'updatedAt'>): Promise<ICategory> {
    const supabase = getSupabase();
    
    const { data, error } = await supabase
      .from(this.table)
      .insert({
        name: categoryData.name,
        href: categoryData.href,
        is_category: categoryData.isCategory ?? true,
        visible: categoryData.visible ?? true,
        order: categoryData.order ?? 0,
        image: categoryData.image
      })
      .select()
      .single();

    if (error) throw error;
    return dbToModel<ICategory>(data);
  }

  // Find category by ID
  static async findById(id: string): Promise<ICategory | null> {
    if (!isValidUUID(id)) return null;
    
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return dbToModel<ICategory>(data);
  }

  // Find all categories
  static async findMany(filter: Record<string, unknown> = {}, options: { sort?: Record<string, number>; limit?: number } = {}): Promise<ICategory[]> {
    const supabase = getSupabase();
    let query = supabase.from(this.table).select('*');
    
    // Apply filters
    if (filter.visible !== undefined) {
      query = query.eq('visible', filter.visible);
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
    return (data || []).map(row => dbToModel<ICategory>(row));
  }

  // Find visible categories ordered by order field
  static async findVisible(): Promise<ICategory[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('visible', true)
      .order('order', { ascending: true });

    if (error) throw error;
    return (data || []).map(row => dbToModel<ICategory>(row));
  }

  // Update category by ID
  static async updateById(id: string, updateData: Partial<ICategory>): Promise<ICategory | null> {
    if (!isValidUUID(id)) return null;
    
    const supabase = getSupabase();
    
    // Convert camelCase to snake_case for update
    const dbData: Record<string, unknown> = {};
    if (updateData.name !== undefined) dbData.name = updateData.name;
    if (updateData.href !== undefined) dbData.href = updateData.href;
    if (updateData.isCategory !== undefined) dbData.is_category = updateData.isCategory;
    if (updateData.visible !== undefined) dbData.visible = updateData.visible;
    if (updateData.order !== undefined) dbData.order = updateData.order;
    if (updateData.image !== undefined) dbData.image = updateData.image;

    const { data, error } = await supabase
      .from(this.table)
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) return null;
    return dbToModel<ICategory>(data);
  }

  // Delete category by ID
  static async deleteById(id: string): Promise<boolean> {
    if (!isValidUUID(id)) return false;
    
    const supabase = getSupabase();
    const { error } = await supabase
      .from(this.table)
      .delete()
      .eq('id', id);

    return !error;
  }

  // Count categories
  static async count(filter: Record<string, unknown> = {}): Promise<number> {
    const supabase = getSupabase();
    const { count, error } = await supabase
      .from(this.table)
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
  }

  // Find category by href
  static async findByHref(href: string): Promise<ICategory | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('href', href)
      .single();

    if (error || !data) return null;
    return dbToModel<ICategory>(data);
  }
}

export default CategoryModel;