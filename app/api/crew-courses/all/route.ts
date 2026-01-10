import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { CrewCourse } from '@/lib/models'

// Mark route as dynamic
export const dynamic = 'force-dynamic'

// GET all crew courses for table display
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const divisionCode = searchParams.get('division')
    const stationCode = searchParams.get('station')
    const designationCode = searchParams.get('designation')

    // Build query
    const query: any = {}
    if (divisionCode) query['division.code'] = divisionCode.toUpperCase()
    if (stationCode) {
      // Station code is like "AJJ", we need to match crewId that starts with it
      // But actually, station is derived from division + crewId
      // For now, if station is provided, we'll filter by division
      query['division.code'] = stationCode.toUpperCase()
    }
    if (designationCode) query['designation.code'] = designationCode.toUpperCase()

    const crewCourses = await CrewCourse.find(query)
      .sort({ createdAt: -1 })
      .lean()

    // Format data for table display
    const formattedData = crewCourses.map((course: any, index: number) => ({
      sno: index + 1,
      crewId: `${course.division.code}${course.crew.crewId}`,
      crewName: course.crew.crewName,
      crewDesignation: course.designation.code,
      dueDate: course.test.dueDate ? new Date(course.test.dueDate).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).replace(/\//g, '-') : 'N/A',
      testCode: course.test.testCode,
      statusReason: course.status || 'ACTIVE',
      station: course.division.code,
      division: course.division.code,
      _id: course._id,
    }))

    return NextResponse.json({
      success: true,
      data: formattedData,
      count: formattedData.length,
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

