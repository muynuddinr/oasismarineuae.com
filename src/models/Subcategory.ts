import { getSupabase, ISubcategory, dbToModel, isValidUUID } from '@/lib/db';

export class SubcategoryModel {
  static table = 'subcategories';

  static async create(data: Omit<ISubcategory, '_id' | 'id' | 'createdAt' | 'updatedAt'>): Promise<ISubcategory> {
    const supabase = getSupabase();
    
    const { data: result, error } = await supabase
      .from(this.table)
      .insert({
        name: data.name,
        href: data.href,
        category_id: data.categoryId,
        visible: data.visible ?? true,
        order: data.order ?? 0,
        image: data.image
      })
      .select()
      .single();

    if (error) throw error;
    return dbToModel<ISubcategory>(result);
  }

  static async findById(id: string): Promise<ISubcategory | null> {
    if (!isValidUUID(id)) return null;
    
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return dbToModel<ISubcategory>(data);
  }

  static async findMany(
    filter: Record<string, unknown> = {}, 
    options: { sort?: Record<string, number>; limit?: number; skip?: number } = {}
  ): Promise<ISubcategory[]> {
    const supabase = getSupabase();
    let query = supabase.from(this.table).select('*');
    
    // Apply filters
    if (filter.visible !== undefined) {
      query = query.eq('visible', filter.visible);
    }
    if (filter.categoryId || filter.category_id) {
      query = query.eq('category_id', filter.categoryId || filter.category_id);
    }
    
    // Apply sorting
    if (options.sort) {
      const sortKey = Object.keys(options.sort)[0];
      const sortOrder = options.sort[sortKey] === -1 ? false : true;
      const snakeKey = sortKey.replace(/([A-Z])/g, '_$1').toLowerCase();
      query = query.order(snakeKey, { ascending: sortOrder });
    }
    
    // Apply pagination
    if (options.skip) {
      query = query.range(options.skip, options.skip + (options.limit || 100) - 1);
    } else if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(row => dbToModel<ISubcategory>(row));
  }

  static async updateById(id: string, data: Partial<ISubcategory>): Promise<ISubcategory | null> {
    if (!isValidUUID(id)) return null;
    
    const supabase = getSupabase();
    
    // Convert camelCase to snake_case for update
    const dbData: Record<string, unknown> = {};
    if (data.name !== undefined) dbData.name = data.name;
    if (data.href !== undefined) dbData.href = data.href;
    if (data.categoryId !== undefined) dbData.category_id = data.categoryId;
    if (data.visible !== undefined) dbData.visible = data.visible;
    if (data.order !== undefined) dbData.order = data.order;
    if (data.image !== undefined) dbData.image = data.image;

    const { data: result, error } = await supabase
      .from(this.table)
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error || !result) return null;
    return dbToModel<ISubcategory>(result);
  }

  static async deleteById(id: string): Promise<boolean> {
    if (!isValidUUID(id)) return false;
    
    const supabase = getSupabase();
    const { error } = await supabase
      .from(this.table)
      .delete()
      .eq('id', id);

    return !error;
  }

  static async count(filter: Record<string, unknown> = {}): Promise<number> {
    const supabase = getSupabase();
    let query = supabase.from(this.table).select('*', { count: 'exact', head: true });
    
    if (filter.categoryId || filter.category_id) {
      query = query.eq('category_id', filter.categoryId || filter.category_id);
    }
    
    const { count, error } = await query;
    if (error) throw error;
    return count || 0;
  }

  static async findByCategoryId(categoryId: string): Promise<ISubcategory[]> {
    if (!isValidUUID(categoryId)) return [];
    
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('category_id', categoryId)
      .order('order', { ascending: true });

    if (error) throw error;
    return (data || []).map(row => dbToModel<ISubcategory>(row));
  }

  static async getMaxOrder(categoryId?: string): Promise<number> {
    const supabase = getSupabase();
    let query = supabase
      .from(this.table)
      .select('order')
      .order('order', { ascending: false })
      .limit(1);
    
    if (categoryId && isValidUUID(categoryId)) {
      query = query.eq('category_id', categoryId);
    }
    
    const { data, error } = await query;
    if (error || !data || data.length === 0) return 0;
    return data[0].order || 0;
  }
}