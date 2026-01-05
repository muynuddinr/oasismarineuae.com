import { NextRequest, NextResponse } from 'next/server';
import { ContactSubmissionModel } from '@/models';
import { isValidUUID } from '@/lib/db';
import { requireAdminAuth } from '@/middleware/adminAuth';
import { logAdminActionFromRequest } from '@/middleware/auditLog';

// GET - Fetch specific contact submission
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // 🔒 AUTHENTICATION CHECK
  const authError = await requireAdminAuth(request);
  if (authError) {
    logAdminActionFromRequest(request, 'GET_CONTACT_SUBMISSION_UNAUTHORIZED', false, null, 'Unauthorized attempt');
    return authError;
  }

  try {
    // Validate UUID format
    if (!isValidUUID(params.id)) {
      return NextResponse.json(
        { error: 'Invalid submission ID format' },
        { status: 400 }
      );
    }

    const contactSubmission = await ContactSubmissionModel.findById(params.id);

    if (!contactSubmission) {
      return NextResponse.json({ error: 'Contact submission not found' }, { status: 404 });
    }

    // Format response
    const response = {
      ...contactSubmission,
      id: contactSubmission._id?.toString(),
      _id: undefined
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching contact submission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Update contact submission status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // 🔒 AUTHENTICATION CHECK
  const authError = await requireAdminAuth(request);
  if (authError) {
    logAdminActionFromRequest(request, 'UPDATE_CONTACT_SUBMISSION_UNAUTHORIZED', false, null, 'Unauthorized attempt');
    return authError;
  }

  try {
    // Validate UUID format
    if (!isValidUUID(params.id)) {
      return NextResponse.json(
        { error: 'Invalid submission ID format' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status, priority } = body;

    // Validate status if provided
    if (status && !['new', 'read', 'replied'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: new, read, replied' },
        { status: 400 }
      );
    }

    // Validate priority if provided
    if (priority && !['low', 'medium', 'high'].includes(priority)) {
      return NextResponse.json(
        { error: 'Invalid priority. Must be one of: low, medium, high' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {};

    if (status) {
      updateData.status = status;
      if (status === 'replied') {
        updateData.repliedAt = new Date();
      }
    }

    if (priority) {
      updateData.priority = priority;
    }

    const contactSubmission = await ContactSubmissionModel.updateById(params.id, updateData);

    if (!contactSubmission) {
      return NextResponse.json(
        { error: 'Contact submission not found' },
        { status: 404 }
      );
    }

    // 📝 LOG SUCCESS
    logAdminActionFromRequest(request, 'UPDATE_CONTACT_SUBMISSION_SUCCESS', true, { submissionId: params.id, updates: Object.keys(updateData) });

    // Format response
    const response = {
      ...contactSubmission,
      id: contactSubmission._id?.toString(),
      _id: undefined
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error updating contact submission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete contact submission
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // 🔒 AUTHENTICATION CHECK
  const authError = await requireAdminAuth(request);
  if (authError) {
    logAdminActionFromRequest(request, 'DELETE_CONTACT_SUBMISSION_UNAUTHORIZED', false, null, 'Unauthorized attempt');
    return authError;
  }

  try {
    // Validate UUID format
    if (!isValidUUID(params.id)) {
      return NextResponse.json(
        { error: 'Invalid submission ID format' },
        { status: 400 }
      );
    }

    const deleted = await ContactSubmissionModel.deleteById(params.id);

    if (!deleted) {
      logAdminActionFromRequest(request, 'DELETE_CONTACT_SUBMISSION_NOT_FOUND', false, { submissionId: params.id }, 'Submission not found');
      return NextResponse.json(
        { error: 'Contact submission not found' },
        { status: 404 }
      );
    }

    // 📝 LOG SUCCESS
    logAdminActionFromRequest(request, 'DELETE_CONTACT_SUBMISSION_SUCCESS', true, { submissionId: params.id });

    return NextResponse.json({ success: true, message: 'Contact submission deleted successfully' });

  } catch (error) {
    console.error('Error deleting contact submission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
