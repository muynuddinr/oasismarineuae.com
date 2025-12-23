import { ObjectId } from 'mongodb';
import { getCollection, IContactSubmission, toObjectId } from '../lib/db';

export class ContactSubmissionModel {
  static collection = 'contact_submissions';

  // Create a new contact submission
  static async create(submissionData: Omit<IContactSubmission, '_id' | 'createdAt' | 'updatedAt'>): Promise<IContactSubmission> {
    const collection = await getCollection(this.collection);
    const now = new Date();
    
    const submission: IContactSubmission = {
      ...submissionData,
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(submission);
    return { ...submission, _id: result.insertedId };
  }

  // Find submission by ID
  static async findById(id: string): Promise<IContactSubmission | null> {
    const collection = await getCollection(this.collection);
    const submission = await collection.findOne({ _id: toObjectId(id) }) as IContactSubmission | null;
    return submission;
  }

  // Find all submissions
  static async findMany(filter: any = {}, options: any = {}): Promise<IContactSubmission[]> {
    const collection = await getCollection(this.collection);
    const submissions = await collection.find(filter, options).toArray() as IContactSubmission[];
    return submissions;
  }

  // Find submissions by status
  static async findByStatus(status: 'new' | 'read' | 'replied', options: any = {}): Promise<IContactSubmission[]> {
    const collection = await getCollection(this.collection);
    const submissions = await collection.find(
      { status },
      options
    ).toArray() as IContactSubmission[];
    return submissions;
  }

  // Update submission by ID
  static async updateById(id: string, updateData: Partial<IContactSubmission>): Promise<IContactSubmission | null> {
    const collection = await getCollection(this.collection);
    const now = new Date();
    
    const result = await collection.findOneAndUpdate(
      { _id: toObjectId(id) },
      { 
        $set: { 
          ...updateData, 
          updatedAt: now 
        }
      },
      { returnDocument: 'after' }
    );

    return result?.value as IContactSubmission | null;
  }

  // Mark submission as read
  static async markAsRead(id: string): Promise<boolean> {
    const collection = await getCollection(this.collection);
    const result = await collection.updateOne(
      { _id: toObjectId(id) },
      { 
        $set: { 
          status: 'read',
          updatedAt: new Date()
        }
      }
    );
    return result.modifiedCount === 1;
  }

  // Mark submission as replied
  static async markAsReplied(id: string): Promise<boolean> {
    const collection = await getCollection(this.collection);
    const now = new Date();
    const result = await collection.updateOne(
      { _id: toObjectId(id) },
      { 
        $set: { 
          status: 'replied',
          repliedAt: now,
          updatedAt: now
        }
      }
    );
    return result.modifiedCount === 1;
  }

  // Delete submission by ID
  static async deleteById(id: string): Promise<boolean> {
    const collection = await getCollection(this.collection);
    const result = await collection.deleteOne({ _id: toObjectId(id) });
    return result.deletedCount === 1;
  }

  // Count submissions
  static async count(filter: any = {}): Promise<number> {
    const collection = await getCollection(this.collection);
    return await collection.countDocuments(filter);
  }

  // Get submissions by priority
  static async findByPriority(priority: 'low' | 'medium' | 'high', options: any = {}): Promise<IContactSubmission[]> {
    const collection = await getCollection(this.collection);
    const submissions = await collection.find(
      { priority },
      options
    ).toArray() as IContactSubmission[];
    return submissions;
  }

  // Get recent submissions
  static async getRecent(limit: number = 10): Promise<IContactSubmission[]> {
    const collection = await getCollection(this.collection);
    const submissions = await collection.find(
      {},
      { 
        sort: { createdAt: -1 },
        limit: limit
      }
    ).toArray() as IContactSubmission[];
    return submissions;
  }
}

export default ContactSubmissionModel;