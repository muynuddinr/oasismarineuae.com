import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { cookies } from 'next/headers';
import { requireAdminAuth } from '@/middleware/adminAuth';
import { logAdminActionFromRequest } from '@/middleware/auditLog';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  // 🔒 AUTHENTICATION CHECK
  const authError = await requireAdminAuth(request);
  if (authError) {
    logAdminActionFromRequest(request, 'UPLOAD_FILE_UNAUTHORIZED', false, null, 'Unauthorized attempt');
    return authError;
  }

  try {

    // Check environment variables
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('Missing Cloudinary environment variables');
      return NextResponse.json(
        { error: 'Cloudinary configuration missing' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'image' or 'pdf'

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      console.warn('Invalid file type:', file.type);
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WebP images and PDFs are allowed.' },
        { status: 400 }
      );
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      console.warn('File too large:', file.size);
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Validate file type
    if (type === 'image' && !file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Invalid image file type' },
        { status: 400 }
      );
    }

    if (type === 'pdf' && file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Invalid PDF file type' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadOptions: any = {
        folder: type === 'pdf' ? 'product-catalogs' : 'product-images',
        resource_type: type === 'pdf' ? 'raw' : 'image',
        use_filename: true,
        unique_filename: true,
      };

      if (type === 'image') {
        uploadOptions.transformation = [
          { quality: 'auto', fetch_format: 'auto' }
        ];
      }

      cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      ).end(buffer);
    });

    // 📝 LOG SUCCESS
    logAdminActionFromRequest(request, 'UPLOAD_FILE_SUCCESS', true, { 
      publicId: (uploadResult as any).public_id,
      type,
      fileName: file.name
    });

    return NextResponse.json({
      url: (uploadResult as any).secure_url,
      publicId: (uploadResult as any).public_id,
      type
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    logAdminActionFromRequest(request, 'UPLOAD_FILE_ERROR', false, null, error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: `Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  // 🔒 AUTHENTICATION CHECK
  const authError = await requireAdminAuth(request);
  if (authError) {
    logAdminActionFromRequest(request, 'DELETE_FILE_UNAUTHORIZED', false, null, 'Unauthorized attempt');
    return authError;
  }

  try {
    const { searchParams } = new URL(request.url);
    const publicId = searchParams.get('publicId');
    const type = searchParams.get('type'); // 'image' or 'pdf'

    if (!publicId) {
      return NextResponse.json(
        { error: 'Public ID is required' },
        { status: 400 }
      );
    }

    // Delete from Cloudinary
    const deleteOptions: any = {
      resource_type: type === 'pdf' ? 'raw' : 'image'
    };

    await cloudinary.uploader.destroy(publicId, deleteOptions);

    // 📝 LOG SUCCESS
    logAdminActionFromRequest(request, 'DELETE_FILE_SUCCESS', true, { publicId, type });

    return NextResponse.json({ message: 'File deleted successfully' });

  } catch (error) {
    console.error('Error deleting file:', error);
    logAdminActionFromRequest(request, 'DELETE_FILE_ERROR', false, null, error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}
