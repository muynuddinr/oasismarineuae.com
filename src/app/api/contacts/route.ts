import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ContactModel, UserModel } from '@/models'
import { ObjectId } from 'mongodb'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { 
      phone, 
      subject, 
      message, 
      priority = 'medium',
      productId,
      productName,
      productImage 
    } = body

    console.log('Creating contact with data:', {
      userId: (session.user as any).id,
      name: session.user.name,
      email: session.user.email,
      phone,
      subject,
      message,
      priority,
      productId,
      productName,
      productImage
    })

    // Create contact entry
    const contact = await ContactModel.create({
      name: session.user.name || '',
      email: session.user.email || '',
      phone: phone || '',
      subject,
      message,
      priority: priority as 'low' | 'medium' | 'high',
      status: 'new',
      userId: new ObjectId((session.user as any).id),
      productId: productId ? new ObjectId(productId) : undefined,
      productName
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

export async function GET() {
  try {
    console.log('Fetching contacts...')
    
    // Fetch all contacts
    const contacts = await ContactModel.findMany({}, {
      sort: { createdAt: -1 }
    })

    // Get user data for each contact
    const contactsWithUsers = await Promise.all(
      contacts.map(async (contact) => {
        let user = null;
        if (contact.userId) {
          user = await UserModel.findById(contact.userId.toString());
          if (user) {
            user = {
              id: user._id?.toString(),
              name: user.name,
              email: user.email,
              image: user.image
            };
          }
        }

        return {
          ...contact,
          id: contact._id?.toString(),
          _id: undefined,
          userId: contact.userId?.toString(),
          productId: contact.productId?.toString(),
          user
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
