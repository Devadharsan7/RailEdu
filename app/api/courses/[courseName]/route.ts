import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { BatchAssignment, CrewCourse, AlertNotification } from '@/lib/models'

// Mark route as dynamic
export const dynamic = 'force-dynamic'

// GET: Get course details with batch assignments and members
export async function GET(
  request: NextRequest,
  { params }: { params: { courseName: string } }
) {
  try {
    await connectDB()

    const courseName = decodeURIComponent(params.courseName)

    // Find all batch assignments for this course
    const assignments = await BatchAssignment.find({
      'course.name': courseName,
    })
      .sort({ batchNumber: 1, classNumber: 1 })
      .lean()

    if (assignments.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          courseName,
          courseDetails: {
            name: courseName,
            timing: 'N/A',
            batchMonths: [],
            batchYear: new Date().getFullYear(),
          },
          station: {
            id: '',
            name: 'N/A',
            code: 'N/A',
          },
          excelId: '',
          batches: [],
          totalMembers: 0,
          totalBatches: 0,
          totalClasses: 0,
        },
      })
    }

    // Get unique excelId to get course details
    const excelIds = Array.from(new Set(assignments.map((a) => a.excelId)))
    const firstExcelId = excelIds[0]
    const firstAssignment = assignments[0]

    // Get crew course IDs
    const crewCourseIds = assignments.map((a) => a.crewCourseId)
    const crewCourses = await CrewCourse.find({
      _id: { $in: crewCourseIds },
    }).lean()

    const crewCourseMap = new Map()
    crewCourses.forEach((cc) => {
      crewCourseMap.set(cc._id.toString(), cc)
    })

    // Get alerts for these crew courses
    const alerts = await AlertNotification.find({
      crewCourseId: { $in: crewCourseIds },
    })
      .sort({ sentAt: -1 })
      .lean()

    // Group alerts by crewCourseId
    const alertsByCrewCourse = new Map()
    alerts.forEach((alert) => {
      const crewCourseId = alert.crewCourseId
      if (!alertsByCrewCourse.has(crewCourseId)) {
        alertsByCrewCourse.set(crewCourseId, [])
      }
      alertsByCrewCourse.get(crewCourseId).push(alert)
    })

    // Group assignments by batch and class
    const batchesMap = new Map<number, Map<number, any[]>>()

    assignments.forEach((assignment) => {
      const batchNum = assignment.batchNumber
      const classNum = assignment.classNumber

      if (!batchesMap.has(batchNum)) {
        batchesMap.set(batchNum, new Map())
      }

      const classesMap = batchesMap.get(batchNum)!
      if (!classesMap.has(classNum)) {
        classesMap.set(classNum, [])
      }

      const crewCourse = crewCourseMap.get(assignment.crewCourseId)
      const memberAlerts = alertsByCrewCourse.get(assignment.crewCourseId) || []

      classesMap.get(classNum)!.push({
        assignmentId: assignment._id.toString(),
        crewCourseId: assignment.crewCourseId,
        crewId: crewCourse?.crew.crewId || 'N/A',
        crewName: crewCourse?.crew.crewName || 'Unknown',
        divisionCode: crewCourse?.division.code || 'N/A',
        designationCode: crewCourse?.designation.code || 'N/A',
        testCode: crewCourse?.test.testCode || 'N/A',
        dueDate: crewCourse?.test.dueDate || null,
        status: crewCourse?.status || 'ACTIVE',
        alerts: memberAlerts.map((alert: any) => ({
          id: alert._id.toString(),
          type: alert.alertType,
          message: alert.message,
          sentAt: alert.sentAt,
          read: alert.read,
        })),
        batchNumber: assignment.batchNumber,
        classNumber: assignment.classNumber,
        assignedAt: assignment.assignedAt,
      })
    })

    // Convert to array format
    const batches = Array.from(batchesMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([batchNumber, classesMap]) => {
        const classes = Array.from(classesMap.entries())
          .sort(([a], [b]) => a - b)
          .map(([classNumber, members]) => ({
            classNumber,
            members,
            memberCount: members.length,
          }))

        return {
          batchNumber,
          classes,
          totalMembers: Array.from(classesMap.values()).reduce(
            (sum, members) => sum + members.length,
            0
          ),
          totalClasses: classes.length,
        }
      })

    // Calculate totals
    const totalMembers = assignments.length
    const totalBatches = batches.length
    const totalClasses = batches.reduce((sum, batch) => sum + batch.totalClasses, 0)

    return NextResponse.json({
      success: true,
      data: {
        courseName,
        courseDetails: {
          name: firstAssignment.course.name,
          timing: firstAssignment.course.timing,
          batchMonths: firstAssignment.course.batchMonths,
          batchYear: firstAssignment.course.batchYear,
        },
        station: firstAssignment.station,
        excelId: firstExcelId,
        batches,
        totalMembers,
        totalBatches,
        totalClasses,
      },
    })
  } catch (error: any) {
    console.error('Error fetching course details:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch course details',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

