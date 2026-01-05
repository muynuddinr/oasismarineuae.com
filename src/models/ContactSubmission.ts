import { getSupabase, IContactSubmission, dbToModel, isValidUUID } from '../lib/db';

export class ContactSubmissionModel {
  static table = 'contact_submissions';

  // Create a new contact submission
  static async create(submissionData: Omit<IContactSubmission, '_id' | 'id' | 'createdAt' | 'updatedAt'>): Promise<IContactSubmission> {
    const supabase = getSupabase();
    
    const { data, error } = await supabase
      .from(this.table)
      .insert({
        name: submissionData.name,
        email: submissionData.email,
        subject: submissionData.subject,
        message: submissionData.message,
        status: submissionData.status || 'new',
        priority: submissionData.priority || 'medium',
        source: submissionData.source,
        ip_address: submissionData.ipAddress,
        user_agent: submissionData.userAgent
      })
      .select()
      .single();

    if (error) throw error;
    return dbToModel<IContactSubmission>(data);
  }

  // Find submission by ID
  static async findById(id: string): Promise<IContactSubmission | null> {
    if (!isValidUUID(id)) return null;
    
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return dbToModel<IContactSubmission>(data);
  }

  // Find all submissions
  static async findMany(filter: Record<string, unknown> = {}, options: { sort?: Record<string, number>; limit?: number } = {}): Promise<IContactSubmission[]> {
    const supabase = getSupabase();
    let query = supabase.from(this.table).select('*');
    
    // Apply filters
    if (filter.status) {
      query = query.eq('status', filter.status);
    }
    if (filter.priority) {
      query = query.eq('priority', filter.priority);
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
    return (data || []).map(row => dbToModel<IContactSubmission>(row));
  }

  // Find submissions by status
  static async findByStatus(status: 'new' | 'read' | 'replied', options: { sort?: Record<string, number>; limit?: number } = {}): Promise<IContactSubmission[]> {
    return this.findMany({ status }, options);
  }

  // Update submission by ID
  static async updateById(id: string, updateData: Partial<IContactSubmission>): Promise<IContactSubmission | null> {
    if (!isValidUUID(id)) return null;
    
    const supabase = getSupabase();
    
    // Convert camelCase to snake_case for update
    const dbData: Record<string, unknown> = {};
    if (updateData.name !== undefined) dbData.name = updateData.name;
    if (updateData.email !== undefined) dbData.email = updateData.email;
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
    return dbToModel<IContactSubmission>(data);
  }

  // Mark submission as read
  static async markAsRead(id: string): Promise<boolean> {
    if (!isValidUUID(id)) return false;
    
    const supabase = getSupabase();
    const { error } = await supabase
      .from(this.table)
      .update({ status: 'read' })
      .eq('id', id);

    return !error;
  }

  // Mark submission as replied
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

  // Delete submission by ID
  static async deleteById(id: string): Promise<boolean> {
    if (!isValidUUID(id)) return false;
    
    const supabase = getSupabase();
    const { error } = await supabase
      .from(this.table)
      .delete()
      .eq('id', id);

    return !error;
  }

  // Count submissions
  static async count(filter: Record<string, unknown> = {}): Promise<number> {
    const supabase = getSupabase();
    const { count, error } = await supabase
      .from(this.table)
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
  }

  // Get submissions by priority
  static async findByPriority(priority: 'low' | 'medium' | 'high', options: { sort?: Record<string, number>; limit?: number } = {}): Promise<IContactSubmission[]> {
    return this.findMany({ priority }, options);
  }

  // Get recent submissions
  static async getRecent(limit: number = 10): Promise<IContactSubmission[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map(row => dbToModel<IContactSubmission>(row));
  }
}

export default ContactSubmissionModel;