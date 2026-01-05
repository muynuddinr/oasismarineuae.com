import { getSupabase, IContact, dbToModel, isValidUUID } from '../lib/db';

export class ContactModel {
  static table = 'contacts';

  // Create a new contact
  static async create(contactData: Omit<IContact, '_id' | 'id' | 'createdAt' | 'updatedAt'>): Promise<IContact> {
    const supabase = getSupabase();
    
    const { data, error } = await supabase
      .from(this.table)
      .insert({
        name: contactData.name,
        email: contactData.email,
        phone: contactData.phone,
        subject: contactData.subject,
        message: contactData.message,
        status: contactData.status || 'new',
        priority: contactData.priority || 'medium',
        user_id: contactData.userId,
        product_id: contactData.productId,
        product_name: contactData.productName,
        product_image: contactData.productImage,
        enquiry_type: contactData.enquiryType || 'general'
      })
      .select()
      .single();

    if (error) throw error;
    return dbToModel<IContact>(data);
  }

  // Find contact by ID
  static async findById(id: string): Promise<IContact | null> {
    if (!isValidUUID(id)) return null;
    
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return dbToModel<IContact>(data);
  }

  // Find all contacts
  static async findMany(filter: Record<string, unknown> = {}, options: { sort?: Record<string, number>; limit?: number } = {}): Promise<IContact[]> {
    const supabase = getSupabase();
    let query = supabase.from(this.table).select('*');
    
    // Apply filters
    if (filter.status) {
      query = query.eq('status', filter.status);
    }
    if (filter.userId || filter.user_id) {
      query = query.eq('user_id', filter.userId || filter.user_id);
    }
    if (filter.priority) {
      query = query.eq('priority', filter.priority);
    }
    
    // Handle date filters for createdAt
    if (filter.createdAt) {
      const createdAtFilter = filter.createdAt as Record<string, Date>;
      if (createdAtFilter.$gte) {
        query = query.gte('created_at', createdAtFilter.$gte.toISOString());
      }
      if (createdAtFilter.$lt) {
        query = query.lt('created_at', createdAtFilter.$lt.toISOString());
      }
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
    return (data || []).map(row => dbToModel<IContact>(row));
  }

  // Find contacts by status
  static async findByStatus(status: 'new' | 'read' | 'replied', options: { sort?: Record<string, number>; limit?: number } = {}): Promise<IContact[]> {
    return this.findMany({ status }, options);
  }

  // Find contacts by user ID
  static async findByUserId(userId: string, options: { sort?: Record<string, number>; limit?: number } = {}): Promise<IContact[]> {
    if (!isValidUUID(userId)) return [];
    return this.findMany({ userId }, options);
  }

  // Update contact by ID
  static async updateById(id: string, updateData: Partial<IContact>): Promise<IContact | null> {
    if (!isValidUUID(id)) return null;
    
    const supabase = getSupabase();
    
    // Convert camelCase to snake_case for update
    const dbData: Record<string, unknown> = {};
    if (updateData.name !== undefined) dbData.name = updateData.name;
    if (updateData.email !== undefined) dbData.email = updateData.email;
    if (updateData.phone !== undefined) dbData.phone = updateData.phone;
    if (updateData.subject !== undefined) dbData.subject = updateData.subject;
    if (updateData.message !== undefined) dbData.message = updateData.message;
    if (updateData.status !== undefined) dbData.status = updateData.status;
    if (updateData.priority !== undefined) dbData.priority = updateData.priority;
    if (updateData.repliedAt !== undefined) dbData.replied_at = updateData.repliedAt;

    const { data, error } = await supabase
      .from(this.table)
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) return null;
    return dbToModel<IContact>(data);
  }

  // Mark contact as read
  static async markAsRead(id: string): Promise<boolean> {
    if (!isValidUUID(id)) return false;
    
    const supabase = getSupabase();
    const { error } = await supabase
      .from(this.table)
      .update({ status: 'read' })
      .eq('id', id);

    return !error;
  }

  // Mark contact as replied
  static async markAsReplied(id: string): Promise<boolean> {
    if (!isValidUUID(id)) return false;
    
    const supabase = getSupabase();
    const { error } = await supabase
      .from(this.table)
      .update({ 
        status: 'replied',
        replied_at: new Date().toISOString()
      })
      .eq('id', id);

    return !error;
  }

  // Delete contact by ID
  static async deleteById(id: string): Promise<boolean> {
    if (!isValidUUID(id)) return false;
    
    const supabase = getSupabase();
    const { error } = await supabase
      .from(this.table)
      .delete()
      .eq('id', id);

    return !error;
  }

  // Count contacts
  static async count(filter: Record<string, unknown> = {}): Promise<number> {
    const supabase = getSupabase();
    let query = supabase.from(this.table).select('*', { count: 'exact', head: true });
    
    if (filter.status) {
      query = query.eq('status', filter.status);
    }
    
    // Handle date filters for createdAt
    if (filter.createdAt) {
      const createdAtFilter = filter.createdAt as Record<string, Date>;
      if (createdAtFilter.$gte) {
        query = query.gte('created_at', createdAtFilter.$gte.toISOString());
      }
      if (createdAtFilter.$lt) {
        query = query.lt('created_at', createdAtFilter.$lt.toISOString());
      }
    }
    
    const { count, error } = await query;
    if (error) throw error;
    return count || 0;
  }

  // Get contacts by priority
  static async findByPriority(priority: 'low' | 'medium' | 'high', options: { sort?: Record<string, number>; limit?: number } = {}): Promise<IContact[]> {
    return this.findMany({ priority }, options);
  }

  // Get recent contacts
  static async getRecent(limit: number = 10): Promise<IContact[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map(row => dbToModel<IContact>(row));
  }
}

export default ContactModel;