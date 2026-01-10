import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { CrewCourse } from '@/lib/models'

// GET crew courses with optional filters
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const excelId = searchParams.get('excelId')
    const crewId = searchParams.get('crewId')
    const designationCode = searchParams.get('designationCode')
    const testStatus = searchParams.get('testStatus')

    // Build query
    const query: any = {}
    if (excelId) query.excelId = excelId
    if (crewId) query['crew.crewId'] = crewId
    if (designationCode) query['designation.code'] = designationCode
    if (testStatus) query['test.status'] = testStatus

    const crewCourses = await CrewCourse.find(query)
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({
      success: true,
      data: crewCourses,
      count: crewCourses.length,
    })
  } catch (error: any) {
    console.error('Error fetching crew courses:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch crew courses',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

