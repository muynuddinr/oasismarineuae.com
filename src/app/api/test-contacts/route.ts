import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ContactModel } from '@/models/Contact'

export async function GET() {
  try {
    console.log('🔍 Testing all contact methods...')

    // Test 1: Count contacts
    const count = await ContactModel.count()
    console.log('✅ Contact count:', count)

    // Test 2: Find all contacts
    const contacts = await ContactModel.findMany({}, { limit: 5, sort: { createdAt: -1 } })
    console.log('✅ Find contacts:', contacts.length)

    // Test 3: Create a test contact (if no contacts exist)
    let testContact = null
    if (count === 0) {
      testContact = await ContactModel.create({
        name: 'Test User',
        email: 'test@example.com',
        phone: '123-456-7890',
        subject: 'Test Contact',
        message: 'This is a test contact message',
        status: 'new',
        priority: 'medium'
      })
      console.log('✅ Created test contact:', testContact._id)
    }

    return NextResponse.json({
      success: true,
      tests: {
        count: count,
        findMany: contacts.length,
        create: testContact ? 'Created test contact' : 'Skipped (contacts exist)',
      },
      sample: contacts.slice(0, 2),
      message: 'All contact methods are working!'
    })

  } catch (error) {
    console.error('❌ Error testing contacts:', error)
    return NextResponse.json({
      success: false,
      error: (error as any).message,
      message: 'Some contact methods failed'
    }, { status: 500 })
  }
}
