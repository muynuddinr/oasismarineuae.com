import { getSupabase } from '../lib/db';

export interface DashboardStatsData {
  id?: string;
  total_products: number;
  total_categories: number;
  total_subcategories: number;
  total_contacts: number;
  total_enquiries: number;
  updated_at?: string;
}

const DashboardStatsModel = {
  /**
   * Get the current dashboard stats
   */
  async get(): Promise<DashboardStatsData | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('dashboard_stats')
      .select('*')
      .single();

    if (error) {
      console.error('Error fetching dashboard stats:', error);
      return null;
    }

    return data;
  },

  /**
   * Update or insert dashboard stats
   */
  async upsert(stats: Partial<DashboardStatsData>): Promise<DashboardStatsData | null> {
    const supabase = getSupabase();
    // First check if stats exist
    const existing = await this.get();
    
    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('dashboard_stats')
        .update({
          ...stats,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating dashboard stats:', error);
        return null;
      }
      return data;
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('dashboard_stats')
        .insert({
          total_products: stats.total_products ?? 0,
          total_categories: stats.total_categories ?? 0,
          total_subcategories: stats.total_subcategories ?? 0,
          total_contacts: stats.total_contacts ?? 0,
          total_enquiries: stats.total_enquiries ?? 0,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error inserting dashboard stats:', error);
        return null;
      }
      return data;
    }
  },

  /**
   * Increment a specific stat
   */
  async increment(field: keyof Omit<DashboardStatsData, 'id' | 'updated_at'>, amount: number = 1): Promise<boolean> {
    const supabase = getSupabase();
    const existing = await this.get();
    
    if (!existing) {
      // Create with default values and increment the field
      const newStats: Partial<DashboardStatsData> = {
        total_products: 0,
        total_categories: 0,
        total_subcategories: 0,
        total_contacts: 0,
        total_enquiries: 0,
        [field]: amount
      };
      const result = await this.upsert(newStats);
      return result !== null;
    }

    const { error } = await supabase
      .from('dashboard_stats')
      .update({
        [field]: (existing[field] as number) + amount,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id);

    if (error) {
      console.error('Error incrementing dashboard stat:', error);
      return false;
    }
    return true;
  },

  /**
   * Decrement a specific stat (won't go below 0)
   */
  async decrement(field: keyof Omit<DashboardStatsData, 'id' | 'updated_at'>, amount: number = 1): Promise<boolean> {
    const supabase = getSupabase();
    const existing = await this.get();
    
    if (!existing) {
      return false;
    }

    const currentValue = existing[field] as number;
    const newValue = Math.max(0, currentValue - amount);

    const { error } = await supabase
      .from('dashboard_stats')
      .update({
        [field]: newValue,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id);

    if (error) {
      console.error('Error decrementing dashboard stat:', error);
      return false;
    }
    return true;
  },

  /**
   * Recalculate all stats from actual table counts
   * Useful for syncing if stats get out of sync
   */
  async recalculate(): Promise<DashboardStatsData | null> {
    const supabase = getSupabase();
    // Get counts from all tables
    const [productsResult, categoriesResult, subcategoriesResult, contactsResult, enquiriesResult] = await Promise.all([
      supabase.from('products').select('id', { count: 'exact', head: true }),
      supabase.from('categories').select('id', { count: 'exact', head: true }),
      supabase.from('subcategories').select('id', { count: 'exact', head: true }),
      supabase.from('contacts').select('id', { count: 'exact', head: true }),
      supabase.from('contact_submissions').select('id', { count: 'exact', head: true })
    ]);

    const stats: Partial<DashboardStatsData> = {
      total_products: productsResult.count ?? 0,
      total_categories: categoriesResult.count ?? 0,
      total_subcategories: subcategoriesResult.count ?? 0,
      total_contacts: contactsResult.count ?? 0,
      total_enquiries: enquiriesResult.count ?? 0
    };

    return this.upsert(stats);
  }
};

export default DashboardStatsModel;
