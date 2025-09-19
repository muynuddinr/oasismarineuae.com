import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { UserModel } from '@/models/User';

export async function GET() {
  try {
    // Test the database connection
    await connectToDatabase();
    
    // Try to get user count as a test query
    const userCount = await UserModel.count();
    
    return NextResponse.json({ 
      message: 'Database connection successful',
      userCount,
      database: 'MongoDB Atlas'
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json(
      { 
        error: 'Database connection failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
