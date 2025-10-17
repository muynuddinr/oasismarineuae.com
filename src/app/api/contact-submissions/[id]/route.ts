import { NextRequest, NextResponse } from 'next/server';
import { ContactSubmissionModel } from '@/models';
import { ObjectId } from 'mongodb';

// GET - Fetch specific contact submission
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate ObjectId format
    if (!ObjectId.isValid(params.id)) {
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
  try {
    // Validate ObjectId format
    if (!ObjectId.isValid(params.id)) {
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
  try {
    // Validate ObjectId format
    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: 'Invalid submission ID format' },
        { status: 400 }
      );
    }

    const deleted = await ContactSubmissionModel.deleteById(params.id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Contact submission not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Contact submission deleted successfully' });

  } catch (error) {
    console.error('Error deleting contact submission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
