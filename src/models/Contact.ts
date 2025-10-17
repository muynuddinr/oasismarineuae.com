import { ObjectId } from 'mongodb';
import { getCollection, IContact, toObjectId } from '../lib/db';

export class ContactModel {
  static collection = 'contacts';

  // Create a new contact
  static async create(contactData: Omit<IContact, '_id' | 'createdAt' | 'updatedAt'>): Promise<IContact> {
    const collection = await getCollection(this.collection);
    const now = new Date();
    
    const contact: IContact = {
      ...contactData,
      enquiryType: contactData.enquiryType || 'general',
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(contact);
    return { ...contact, _id: result.insertedId };
  }

  // Find contact by ID
  static async findById(id: string): Promise<IContact | null> {
    const collection = await getCollection(this.collection);
    const contact = await collection.findOne({ _id: toObjectId(id) }) as IContact | null;
    return contact;
  }

  // Find all contacts
  static async findMany(filter: any = {}, options: any = {}): Promise<IContact[]> {
    const collection = await getCollection(this.collection);
    const contacts = await collection.find(filter, options).toArray() as IContact[];
    return contacts;
  }

  // Find contacts by status
  static async findByStatus(status: 'new' | 'read' | 'replied', options: any = {}): Promise<IContact[]> {
    const collection = await getCollection(this.collection);
    const contacts = await collection.find(
      { status },
      options
    ).toArray() as IContact[];
    return contacts;
  }

  // Find contacts by user ID
  static async findByUserId(userId: string, options: any = {}): Promise<IContact[]> {
    const collection = await getCollection(this.collection);
    const contacts = await collection.find(
      { userId: toObjectId(userId) },
      options
    ).toArray() as IContact[];
    return contacts;
  }

  // Update contact by ID
  static async updateById(id: string, updateData: Partial<IContact>): Promise<IContact | null> {
    console.log('ContactModel.updateById called with ID:', id);
    console.log('Update data:', JSON.stringify(updateData, null, 2));
    
    const collection = await getCollection(this.collection);
    const now = new Date();
    
    try {
      const objectId = toObjectId(id);
      console.log('Converted to ObjectId:', objectId);
      
      const result = await collection.findOneAndUpdate(
        { _id: objectId },
        { 
          $set: { 
            ...updateData, 
            updatedAt: now 
          }
        },
        { 
          returnDocument: 'after',
          upsert: false
        }
      );

      console.log('MongoDB findOneAndUpdate result:', result);
      console.log('Document found:', !!result);
      
      return result as IContact | null;
    } catch (error) {
      console.error('Error in ContactModel.updateById:', error);
      throw error;
    }
  }

  // Mark contact as read
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

  // Mark contact as replied
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

  // Delete contact by ID
  static async deleteById(id: string): Promise<boolean> {
    const collection = await getCollection(this.collection);
    const result = await collection.deleteOne({ _id: toObjectId(id) });
    return result.deletedCount === 1;
  }

  // Count contacts
  static async count(filter: any = {}): Promise<number> {
    const collection = await getCollection(this.collection);
    return await collection.countDocuments(filter);
  }

  // Get contacts by priority
  static async findByPriority(priority: 'low' | 'medium' | 'high', options: any = {}): Promise<IContact[]> {
    const collection = await getCollection(this.collection);
    const contacts = await collection.find(
      { priority },
      options
    ).toArray() as IContact[];
    return contacts;
  }

  // Get recent contacts
  static async getRecent(limit: number = 10): Promise<IContact[]> {
    const collection = await getCollection(this.collection);
    const contacts = await collection.find(
      {},
      { 
        sort: { createdAt: -1 },
        limit: limit
      }
    ).toArray() as IContact[];
    return contacts;
  }
}

export default ContactModel;