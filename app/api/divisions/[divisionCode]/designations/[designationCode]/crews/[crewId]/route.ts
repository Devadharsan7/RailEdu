import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { CrewCourse } from '@/lib/models'

// GET user details for a specific crew
// Example: /api/divisions/TBM/designations/MMAN/crews/1844
// Returns: Full details including crew name, due date, test code, status, reason
export async function GET(
  request: NextRequest,
  { params }: { params: { divisionCode: string; designationCode: string; crewId: string } }
) {
  try {
    await connectDB()

    const divisionCode = params.divisionCode.toUpperCase()
    const designationCode = params.designationCode.toUpperCase()
    const crewId = params.crewId

    // Get all crew courses for this specific crew (there might be multiple tests)
    const crewCourses = await CrewCourse.find({
      'division.code': divisionCode,
      'designation.code': designationCode,
      'crew.crewId': crewId,
    })
      .select('crew.crewName test.testCode test.dueDate status reason createdAt')
      .sort({ 'test.dueDate': 1 }) // Sort by due date
      .lean()

    if (!crewCourses || crewCourses.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Crew not found',
        },
        { status: 404 }
      )
    }

    // Get the first record for basic info (all should have same crew name)
    const firstRecord = crewCourses[0] as any

    // Format the response with user details
    const userDetails = {
      crewId: crewId,
      crewName: firstRecord.crew.crewName,
      division: divisionCode,
      designation: designationCode,
      tests: crewCourses.map((course: any) => ({
        testCode: course.test.testCode,
        dueDate: course.test.dueDate,
        status: course.status,
        reason: course.reason || null,
        createdAt: course.createdAt,
      })),
    }

    return NextResponse.json({
      success: true,
      data: userDetails,
    })
  } catch (error: any) {
    console.error('Error fetching user details:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    )
  }
}

