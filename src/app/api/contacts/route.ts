import { NextRequest, NextResponse } from 'next/server'
import { ContactModel, UserModel } from '@/models'
import { ObjectId } from 'mongodb'
import { z } from 'zod'
import DOMPurify from 'dompurify'
import { JSDOM } from 'jsdom'

// Validation schema
const contactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().min(1).max(1000),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  productId: z.string().optional(),
  productName: z.string().optional(),
  productImage: z.string().optional(),
  enquiryType: z.enum(['general', 'product', 'support']).default('general'),
  userId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    // CSRF check
    const csrfToken = request.headers.get('x-csrf-token');
    if (!csrfToken || csrfToken !== process.env.CSRF_SECRET) {
      console.warn('Invalid CSRF token');
      return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
    }

    const body = await request.json()

    // Validate input
    const validated = contactSchema.safeParse(body)
    if (!validated.success) {
      console.warn('Invalid input for contact:', validated.error.issues)
      return NextResponse.json(
        { error: 'Invalid input data' },
        { status: 400 }
      )
    }

    const data = validated.data

    // Sanitize strings
    const window = new JSDOM('').window
    const DOMPurifyServer = DOMPurify(window)
    data.name = DOMPurifyServer.sanitize(data.name)
    data.email = DOMPurifyServer.sanitize(data.email)
    data.message = DOMPurifyServer.sanitize(data.message)
    if (data.subject) data.subject = DOMPurifyServer.sanitize(data.subject)
    if (data.phone) data.phone = DOMPurifyServer.sanitize(data.phone)

    // Log the request

    // Proceed with existing logic
    const { 
      name,
      email,
      phone, 
      subject, 
      message, 
      priority,
      productId,
      productName,
      productImage,
      enquiryType,
      userId
    } = data


    // Create contact entry
    const contact = await ContactModel.create({
      name,
      email,
      phone: phone || '',
      subject: subject || '',
      message,
      priority: priority as 'low' | 'medium' | 'high',
      status: 'new',
      userId: userId ? new ObjectId(userId) : undefined,
      productId: productId ? new ObjectId(productId) : undefined,
      productName,
      productImage,
      enquiryType: enquiryType as 'product' | 'general' | 'support'
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Contact message sent successfully',
      contact: {
        ...contact,
        id: contact._id?.toString(),
        _id: undefined,
        userId: contact.userId?.toString(),
        productId: contact.productId?.toString()
      }
    })

  } catch (error) {
    console.error('Error creating contact:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    
    // Fetch all contacts
    const contacts = await ContactModel.findMany({}, {
      sort: { createdAt: -1 }
    })

    // Get user data for each contact
    const contactsWithUsers = await Promise.all(
      contacts.map(async (contact) => {
        let contactUser = null;
        if (contact.userId) {
          contactUser = await UserModel.findById(contact.userId.toString());
          if (contactUser) {
            contactUser = {
              id: contactUser._id?.toString(),
              name: contactUser.name,
              email: contactUser.email,
              image: contactUser.image
            };
          }
        }

        return {
          ...contact,
          id: contact._id?.toString(),
          _id: undefined,
          userId: contact.userId?.toString(),
          productId: contact.productId?.toString(),
          user: contactUser
        };
      })
    );

    return NextResponse.json(contactsWithUsers)

  } catch (error) {
    console.error('Error fetching contacts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    )
  }
}
