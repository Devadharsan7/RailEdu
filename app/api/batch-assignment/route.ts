import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { assignBatchesAndClasses } from '@/lib/batchAssignment'
import { BatchAssignment, CrewCourse } from '@/lib/models'

// Mark route as dynamic
export const dynamic = 'force-dynamic'

// POST: Manually trigger batch assignment for an Excel file
export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()
    const {
      excelId,
      station,
      course,
    } = body

    if (!excelId || !station || !course) {
      return NextResponse.json(
        { error: 'Missing required fields: excelId, station, course' },
        { status: 400 }
      )
    }

    const result = await assignBatchesAndClasses({
      excelId,
      station,
      course,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to assign batches', details: result.errors },
        { status: 500 }
      )
    }

    // Automatically trigger class scheduling algorithm after batch assignment
    let schedulingResult = null
    if (result.success && result.totalAssigned > 0) {
      try {
        const { scheduleClassesForUsers } = await import('@/lib/classScheduling')
        schedulingResult = await scheduleClassesForUsers()
        
        console.log('Class scheduling completed:', {
          scheduled: schedulingResult.scheduled,
          failed: schedulingResult.failed,
        })
      } catch (schedulingError: any) {
        console.error('Error scheduling classes:', schedulingError)
        // Don't fail the batch assignment if scheduling fails
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully assigned ${result.totalAssigned} members to batches${schedulingResult ? `. Scheduled ${schedulingResult.scheduled} class sessions.` : ''}`,
      data: {
        ...result,
        scheduling: schedulingResult,
      },
    })
  } catch (error: any) {
    console.error('Error in batch assignment API:', error)
    return NextResponse.json(
      {
        error: 'Failed to assign batches',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

// GET: Get batch assignments for an Excel file or crew member
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const excelId = searchParams.get('excelId')
    const crewId = searchParams.get('crewId')
    const divisionCode = searchParams.get('divisionCode')

    if (!excelId && !crewId && !divisionCode) {
      return NextResponse.json(
        { error: 'Please provide excelId, crewId, or divisionCode' },
        { status: 400 }
      )
    }

    let query: any = {}

    if (excelId) {
      query.excelId = excelId
    }

    if (crewId || divisionCode) {
      // Need to find crew courses first to get crewCourseIds
      const crewCourseQuery: any = {}
      if (crewId) {
        crewCourseQuery['crew.crewId'] = crewId
      }
      if (divisionCode) {
        crewCourseQuery['division.code'] = divisionCode
      }

      const crewCourses = await CrewCourse.find(crewCourseQuery).lean()
      const crewCourseIds = crewCourses.map((cc) => cc._id.toString())
      query.crewCourseId = { $in: crewCourseIds }
    }

    const assignments = await BatchAssignment.find(query)
      .sort({ batchNumber: 1, classNumber: 1 })
      .lean()

    // Enrich with crew course details
    const crewCourseIds = Array.from(new Set(assignments.map((a) => a.crewCourseId)))
    const crewCourses = await CrewCourse.find({
      _id: { $in: crewCourseIds },
    }).lean()

    const crewCourseMap = new Map()
    crewCourses.forEach((cc) => {
      crewCourseMap.set(cc._id.toString(), cc)
    })

    const enrichedAssignments = assignments.map((assignment) => {
      const crewCourse = crewCourseMap.get(assignment.crewCourseId)
      return {
        ...assignment,
        member: crewCourse
          ? {
              crewId: crewCourse.crew.crewId,
              crewName: crewCourse.crew.crewName,
              divisionCode: crewCourse.division.code,
              designationCode: crewCourse.designation.code,
              dueDate: crewCourse.test.dueDate,
              testCode: crewCourse.test.testCode,
            }
          : null,
      }
    })

    return NextResponse.json({
      success: true,
      data: enrichedAssignments,
      count: enrichedAssignments.length,
    })
  } catch (error: any) {
    console.error('Error fetching batch assignments:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch batch assignments',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

