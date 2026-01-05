import { NextRequest, NextResponse } from 'next/server'
import { ContactModel } from '@/models'
import { isValidUUID } from '@/lib/db'
import { z } from 'zod'
import { requireAdminAuth } from '@/middleware/adminAuth'
import { logAdminActionFromRequest } from '@/middleware/auditLog'

// Validation schema for PATCH
const updateSchema = z.object({
  status: z.enum(['new', 'in-progress', 'replied', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
}).refine((data) => data.status || data.priority, 'Status or priority is required')

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 🔒 AUTHENTICATION CHECK
  const authError = await requireAdminAuth(request);
  if (authError) {
    logAdminActionFromRequest(request, 'UPDATE_CONTACT_UNAUTHORIZED', false, null, 'Unauthorized attempt');
    return authError;
  }

  try {
    const resolvedParams = await params;
    const contactId = resolvedParams.id;
    
    const body = await request.json()
    
    // Validate UUID format
    if (!isValidUUID(contactId)) {
      return NextResponse.json(
        { error: 'Invalid contact ID format' },
        { status: 400 }
      )
    }

    // Validate input with schema
    const validated = updateSchema.safeParse(body)
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0].message },
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
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }
    
    // 📝 LOG SUCCESS
    logAdminActionFromRequest(request, 'UPDATE_CONTACT_SUCCESS', true, { contactId, updates: Object.keys(updateData) });
    
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
  // 🔒 AUTHENTICATION CHECK
  const authError = await requireAdminAuth(request);
  if (authError) {
    logAdminActionFromRequest(request, 'DELETE_CONTACT_UNAUTHORIZED', false, null, 'Unauthorized attempt');
    return authError;
  }

  try {
    const resolvedParams = await params;
    const contactId = resolvedParams.id;
    
    // Validate UUID format
    if (!isValidUUID(contactId)) {
      return NextResponse.json(
        { error: 'Invalid contact ID format' },
        { status: 400 }
      )
    }
    
    // Delete contact
    const deleted = await ContactModel.deleteById(contactId);

    if (!deleted) {
      logAdminActionFromRequest(request, 'DELETE_CONTACT_NOT_FOUND', false, { contactId }, 'Contact not found');
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }
    
    // 📝 LOG SUCCESS
    logAdminActionFromRequest(request, 'DELETE_CONTACT_SUCCESS', true, { contactId });
    
    return NextResponse.json({ message: 'Contact deleted successfully' })

  } catch (error) {
    console.error('Error deleting contact:', error)
    logAdminActionFromRequest(request, 'DELETE_CONTACT_ERROR', false, null, error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: 'Failed to delete contact' },
      { status: 500 }
    )
  }
}
