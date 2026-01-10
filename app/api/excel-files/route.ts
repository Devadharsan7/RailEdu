import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { ExcelFile, CrewCourse } from '@/lib/models'

// GET all excel files
export async function GET() {
  try {
    await connectDB()

    const excelFiles = await ExcelFile.find({ status: 'ACTIVE' })
      .sort({ uploadedAt: -1 })
      .lean()

    return NextResponse.json({
      success: true,
      data: excelFiles,
    })
  } catch (error: any) {
    console.error('Error fetching excel files:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch excel files',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

