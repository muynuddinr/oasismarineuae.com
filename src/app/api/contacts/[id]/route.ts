import { NextRequest, NextResponse } from 'next/server'
import { ContactModel } from '@/models'
import { ObjectId } from 'mongodb'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const contactId = resolvedParams.id;
    console.log('PATCH request for contact ID:', contactId)
    console.log('Contact ID type:', typeof contactId)
    console.log('Contact ID length:', contactId?.length)
    
    const body = await request.json()
    const { status, priority } = body
    
    console.log('Update data:', { status, priority })

    // Validate input
    if (!status && !priority) {
      console.log('No status or priority provided')
      return NextResponse.json(
        { error: 'Status or priority is required' },
        { status: 400 }
      )
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(contactId)) {
      console.log('Invalid ObjectId format:', contactId);
      console.log('ObjectId.isValid result:', ObjectId.isValid(contactId));
      return NextResponse.json(
        { error: 'Invalid contact ID format' },
        { status: 400 }
      )
    }

    // Prepare update data
    const updateData: any = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (status === 'replied') updateData.repliedAt = new Date();

    console.log('Attempting to update contact with ID:', contactId);
    console.log('ObjectId representation:', new ObjectId(contactId));
    console.log('Update data to apply:', updateData);

    // Update contact
    const updatedContact = await ContactModel.updateById(contactId, updateData);

    console.log('Update result:', updatedContact);

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
