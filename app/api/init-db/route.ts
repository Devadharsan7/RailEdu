import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { ExcelFile, CrewCourse } from '@/lib/models'

// MongoDB doesn't need table initialization, but we can test the connection
// and ensure indexes are created
export async function GET() {
  try {
    await connectDB()

    // Create indexes if they don't exist (Mongoose will handle this automatically)
    // But we can verify the connection by checking if models are accessible
    await ExcelFile.createIndexes()
    await CrewCourse.createIndexes()

    return NextResponse.json({
      success: true,
      message: 'MongoDB connected successfully. Collections and indexes are ready.',
      collections: {
        excel_files: 'Ready',
        crew_courses: 'Ready',
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to connect to MongoDB',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
