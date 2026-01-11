import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { BatchAssignment } from '@/lib/models'

// Mark route as dynamic
export const dynamic = 'force-dynamic'

// GET: Get courses with batch assignments for admin
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const adminId = searchParams.get('adminId')

    if (type === 'admin-courses') {
      // Get all batch assignments grouped by course name
      const batchAssignments = await BatchAssignment.find({})
        .sort({ 'course.name': 1, batchNumber: 1, classNumber: 1 })
        .lean()

      // Also get batch configurations from localStorage (via BatchManagement component)
      // We'll merge both: actual assignments and batch configurations
      
      if (batchAssignments.length === 0) {
        // Even if no assignments, check if there are batch configs
        // For now, return empty - batches will appear once members are assigned
        return NextResponse.json({
          success: true,
          courses: [],
          count: 0,
          message: 'No batch assignments found. Create batches by uploading Excel files and assigning members to batches.',
        })
      }

      // Group by course name
      const coursesMap = new Map<string, any>()

      batchAssignments.forEach((assignment: any) => {
        const courseName = assignment.course.name
        const isPlaceholder = assignment.crewCourseId && assignment.crewCourseId.startsWith('placeholder-')

        if (!coursesMap.has(courseName)) {
          coursesMap.set(courseName, {
            _id: `course-${courseName.replace(/\s+/g, '-').toLowerCase()}`,
            title: courseName,
            description: `Course with batch assignments across multiple stations`,
            duration: 60, // Default duration
            dueDate: new Date().toISOString(), // Will be updated with actual data
            createdBy: adminId || 'system',
            batchDetails: {
              batchId: `batch-${courseName}`,
              maxParticipants: 0,
              currentParticipants: 0,
            },
            batches: new Map<number, Map<number, number>>(), // batchNumber -> classNumber -> count
            totalMembers: 0,
            totalBatches: 0,
            totalClasses: 0,
            stations: new Set<string>(),
            excelIds: new Set<string>(),
            courseInfo: {
              timing: assignment.course.timing,
              batchMonths: assignment.course.batchMonths,
              batchYear: assignment.course.batchYear,
            },
            createdAt: assignment.assignedAt,
            isPlaceholderOnly: true, // Track if course only has placeholders
          })
        }

        const course = coursesMap.get(courseName)!
        course.excelIds.add(assignment.excelId)
        course.stations.add(`${assignment.station.code} - ${assignment.station.name}`)

        // Count batches and classes (include placeholders to show structure)
        if (!course.batches.has(assignment.batchNumber)) {
          course.batches.set(assignment.batchNumber, new Map())
          course.totalBatches++
        }

        const classesMap = course.batches.get(assignment.batchNumber)!
        if (!classesMap.has(assignment.classNumber)) {
          classesMap.set(assignment.classNumber, 0)
          course.totalClasses++
        }

        // Only count actual members (not placeholders)
        if (!isPlaceholder) {
          classesMap.set(assignment.classNumber, classesMap.get(assignment.classNumber)! + 1)
          course.totalMembers++
          course.isPlaceholderOnly = false
          
          // Update max participants (use highest class size)
          const currentClassSize = classesMap.get(assignment.classNumber)!
          if (currentClassSize > course.batchDetails.maxParticipants) {
            course.batchDetails.maxParticipants = currentClassSize
          }
          course.batchDetails.currentParticipants = course.totalMembers
        } else {
          // For placeholders, ensure class exists but count remains 0
          if (classesMap.get(assignment.classNumber)! === 0) {
            // Keep at 0, just mark that structure exists
          }
        }

        // Update due date to earliest assigned date
        const assignedDate = new Date(assignment.assignedAt)
        const currentDueDate = new Date(course.dueDate)
        if (assignedDate < currentDueDate) {
          course.dueDate = assignedDate.toISOString()
        }
      })

      // Convert Map structures to arrays for JSON serialization
      const courses = Array.from(coursesMap.values()).map((course) => {
        const batchesArray = Array.from<[number, Map<number, number>]>(course.batches.entries()).map(([batchNum, classesMap]) => ({
          batchNumber: batchNum,
          classes: Array.from<[number, number]>(classesMap.entries()).map(([classNum, count]) => ({
            classNumber: classNum,
            memberCount: count,
          })),
        }))

        const stationsList = Array.from(course.stations)
        const description = stationsList.length > 0
          ? `Course with batch assignments across ${stationsList.length} station(s): ${stationsList.slice(0, 3).join(', ')}${stationsList.length > 3 ? '...' : ''}`
          : 'Course with batch assignments'

        return {
          ...course,
          description,
          batches: batchesArray,
          stations: stationsList,
          excelIds: Array.from(course.excelIds),
          batchesCount: course.totalBatches,
          classesCount: course.totalClasses,
          isPlaceholderOnly: course.isPlaceholderOnly || false,
        }
      })

      // Sort courses: ones with actual members first, then placeholders
      courses.sort((a, b) => {
        if (a.isPlaceholderOnly && !b.isPlaceholderOnly) return 1
        if (!a.isPlaceholderOnly && b.isPlaceholderOnly) return -1
        return 0
      })

      return NextResponse.json({
        success: true,
        courses,
        count: courses.length,
      })
    }

    if (type === 'user-courses') {
      // Get courses for a specific user based on their crew courses and batch assignments
      const userId = searchParams.get('userId')
      
      if (!userId) {
        return NextResponse.json({
          success: false,
          error: 'userId is required for user-courses',
        }, { status: 400 })
      }

      // For now, return all courses that have batch assignments
      // In the future, filter by user's crewId when user authentication is properly set up
      const batchAssignments = await BatchAssignment.find({
        crewCourseId: { $not: { $regex: /^placeholder-/ } },
        excelId: { $not: { $regex: /^config-/ } },
      })
        .sort({ 'course.name': 1, batchNumber: 1, classNumber: 1 })
        .lean()

      // Group by course name
      const coursesMap = new Map<string, any>()

      batchAssignments.forEach((assignment: any) => {
        const courseName = assignment.course.name

        if (!coursesMap.has(courseName)) {
          coursesMap.set(courseName, {
            _id: `course-${courseName.replace(/\s+/g, '-').toLowerCase()}`,
            title: courseName,
            description: `Course: ${courseName} at ${assignment.station.name || 'N/A'}`,
            duration: 60,
            dueDate: assignment.course.batchYear ? new Date(assignment.course.batchYear, 11, 31).toISOString() : new Date().toISOString(),
            status: 'pending',
            isOverdue: false,
            batchDetails: {
              batchId: `batch-${courseName}`,
              maxParticipants: 0,
              currentParticipants: 0,
            },
            batches: new Map<number, Map<number, number>>(),
            totalMembers: 0,
            totalBatches: 0,
            totalClasses: 0,
            stations: new Set<string>(),
            courseInfo: {
              timing: assignment.course.timing,
              batchMonths: assignment.course.batchMonths,
              batchYear: assignment.course.batchYear,
            },
          })
        }

        const course = coursesMap.get(courseName)!
        course.stations.add(`${assignment.station.code} - ${assignment.station.name}`)

        if (!course.batches.has(assignment.batchNumber)) {
          course.batches.set(assignment.batchNumber, new Map())
          course.totalBatches++
        }

        const classesMap = course.batches.get(assignment.batchNumber)!
        if (!classesMap.has(assignment.classNumber)) {
          classesMap.set(assignment.classNumber, 0)
          course.totalClasses++
        }

        classesMap.set(assignment.classNumber, classesMap.get(assignment.classNumber)! + 1)
        course.totalMembers++
        course.batchDetails.currentParticipants = course.totalMembers
      })

      // Convert to array format
      const userCourses = Array.from(coursesMap.values()).map((course) => {
        const batchesArray = Array.from<[number, Map<number, number>]>(course.batches.entries()).map(([batchNum, classesMap]) => ({
          batchNumber: batchNum,
          classes: Array.from<[number, number]>(classesMap.entries()).map(([classNum, count]) => ({
            classNumber: classNum,
            memberCount: count,
          })),
        }))

        return {
          ...course,
          batches: batchesArray,
          stations: Array.from(course.stations),
          batchesCount: course.totalBatches,
          classesCount: course.totalClasses,
        }
      })

      return NextResponse.json({
        success: true,
        courses: userCourses,
        count: userCourses.length,
      })
    }

    // Handle other types if needed
    return NextResponse.json({
      success: false,
      error: 'Invalid type parameter',
    }, { status: 400 })
  } catch (error: any) {
    console.error('Error fetching courses:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch courses',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

// POST: Handle course actions (create, update, delete)
export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()
    const { action } = body

    // For now, batch assignments are created via /api/batch-assignment
    // This endpoint can be extended for other course management actions
    if (action === 'create' || action === 'update' || action === 'delete') {
      return NextResponse.json({
        success: true,
        message: 'Course management actions should be performed via batch assignment API',
        note: 'Use POST /api/batch-assignment to create batches for courses',
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action',
    }, { status: 400 })
  } catch (error: any) {
    console.error('Error in courses API:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process request',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

