import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { CrewCourse, BatchAssignment } from '@/lib/models'

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

    // Get all crew course IDs to fetch batch assignments
    const crewCourseIds = crewCourses.map((course: any) => course._id.toString())
    
    // Fetch batch assignments for these crew courses
    const batchAssignments = await BatchAssignment.find({
      crewCourseId: { $in: crewCourseIds },
    })
      .sort({ assignedTimeFrom: 1 }) // Get the earliest assigned time if multiple exist
      .lean()

    // Create a map of crewCourseId -> batch assignment (taking the first/earliest one)
    const batchAssignmentMap = new Map<string, any>()
    batchAssignments.forEach((assignment: any) => {
      const crewCourseId = assignment.crewCourseId
      if (!batchAssignmentMap.has(crewCourseId)) {
        batchAssignmentMap.set(crewCourseId, assignment)
      } else {
        // If multiple assignments exist, use the one with earliest assignedTimeFrom
        const existing = batchAssignmentMap.get(crewCourseId)
        if (assignment.assignedTimeFrom && existing.assignedTimeFrom) {
          if (new Date(assignment.assignedTimeFrom) < new Date(existing.assignedTimeFrom)) {
            batchAssignmentMap.set(crewCourseId, assignment)
          }
        } else if (assignment.assignedTimeFrom && !existing.assignedTimeFrom) {
          batchAssignmentMap.set(crewCourseId, assignment)
        }
      }
    })

    // Format data for table display
    const formattedData = crewCourses.map((course: any, index: number) => {
      const batchAssignment = batchAssignmentMap.get(course._id.toString())
      let classTimeFrom: string | null = null
      let classTimeTo: string | null = null
      let duration: number | null = null

      if (batchAssignment?.assignedTimeFrom && batchAssignment?.assignedTimeTo) {
        const fromDate = new Date(batchAssignment.assignedTimeFrom)
        const toDate = new Date(batchAssignment.assignedTimeTo)
        
        // Format dates consistently with dueDate format (DD-MM-YYYY HH:MM)
        classTimeFrom = fromDate.toLocaleString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }).replace(/\//g, '-')
        
        classTimeTo = toDate.toLocaleString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }).replace(/\//g, '-')

        // Calculate duration in minutes
        duration = Math.round((toDate.getTime() - fromDate.getTime()) / (1000 * 60))
      }

      return {
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
        classTimeFrom,
        classTimeTo,
        duration,
        _id: course._id,
      }
    })

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

