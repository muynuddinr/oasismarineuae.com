import { NextRequest, NextResponse } from 'next/server'
import { ContactModel } from '@/models'
import { ObjectId } from 'mongodb'
import { z } from 'zod'

// Validation schema for PATCH
const updateSchema = z.object({
  status: z.enum(['new', 'in-progress', 'replied', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
}).refine((data) => data.status || data.priority, 'Status or priority is required')

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const contactId = resolvedParams.id;
    
    const body = await request.json()
    
    // Validate ObjectId format
    if (!ObjectId.isValid(contactId)) {
      return NextResponse.json(
        { error: 'Invalid contact ID format' },
        { status: 400 }
      )
    }

    // Validate input with schema
    const validated = updateSchema.safeParse(body)
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0].message },
        { status: 400 }
      )
    }

    const { status, priority } = validated.data

    // Prepare update data
    const updateData: any = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (status === 'replied') updateData.repliedAt = new Date();

    // Update contact
    const updatedContact = await ContactModel.updateById(contactId, updateData);

    if (!updatedContact) {
      console.log('Contact not found for ID:', contactId);
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    console.log('Contact updated successfully:', updatedContact._id)
    
    // Format response
    const response = {
      ...updatedContact,
      id: updatedContact._id?.toString(),
      _id: undefined,
      userId: updatedContact.userId?.toString(),
      productId: updatedContact.productId?.toString()
    };

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error updating contact:', error)
    return NextResponse.json(
      { error: 'Failed to update contact' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const contactId = resolvedParams.id;
    console.log('DELETE request for contact ID:', contactId)
    
    // Validate ObjectId format
    if (!ObjectId.isValid(contactId)) {
      return NextResponse.json(
        { error: 'Invalid contact ID format' },
        { status: 400 }
      )
    }
    
    // Delete contact
    const deleted = await ContactModel.deleteById(contactId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    console.log('Contact deleted successfully:', contactId)
    return NextResponse.json({ message: 'Contact deleted successfully' })

  } catch (error) {
    console.error('Error deleting contact:', error)
    return NextResponse.json(
      { error: 'Failed to delete contact' },
      { status: 500 }
    )
  }
}
