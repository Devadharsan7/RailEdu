import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { CrewCourse, BatchAssignment } from '@/lib/models'

// Mark route as dynamic
export const dynamic = 'force-dynamic'

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

// DELETE: Delete all crew courses (clears users page)
export async function DELETE(request: NextRequest) {
  try {
    await connectDB()

    // Delete all batch assignments first (since they reference crew courses)
    const batchDeleteResult = await BatchAssignment.deleteMany({})
    console.log(`Deleted ${batchDeleteResult.deletedCount} batch assignments`)

    // Delete all crew courses
    const deleteResult = await CrewCourse.deleteMany({})
    console.log(`Deleted ${deleteResult.deletedCount} crew courses`)

    return NextResponse.json({
      success: true,
      message: 'All crew courses deleted successfully',
      deletedCount: deleteResult.deletedCount,
      batchAssignmentsDeleted: batchDeleteResult.deletedCount,
      note: 'All data from the users page has been cleared. This includes all crew courses and their related batch assignments.',
    })
  } catch (error: any) {
    console.error('Error deleting crew courses:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete crew courses',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

