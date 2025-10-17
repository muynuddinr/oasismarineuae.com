import { NextRequest, NextResponse } from 'next/server'
import { ContactModel, UserModel } from '@/models'
import { ObjectId } from 'mongodb'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { 
      name,
      email,
      phone, 
      subject, 
      message, 
      priority = 'medium',
      productId,
      productName,
      productImage,
      enquiryType = 'general',
      userId
    } = body

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    console.log('Creating contact with data:', {
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
    })

    // Create contact entry
    const contact = await ContactModel.create({
      name,
      email,
      phone: phone || '',
      subject,
      message,
      priority: priority as 'low' | 'medium' | 'high',
      status: 'new',
      userId: userId ? new ObjectId(userId) : undefined,
      productId: productId ? new ObjectId(productId) : undefined,
      productName,
      productImage,
      enquiryType: enquiryType as 'product' | 'general' | 'support'
    })

    console.log('Contact created successfully:', contact)

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
    console.log('Fetching contacts...')
    
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

    console.log('Found contacts:', contactsWithUsers.length)

    return NextResponse.json(contactsWithUsers)

  } catch (error) {
    console.error('Error fetching contacts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contacts', details: (error as any).message },
      { status: 500 }
    )
  }
}
