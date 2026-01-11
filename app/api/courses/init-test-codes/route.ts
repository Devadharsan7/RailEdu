import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { BatchAssignment, CrewCourse } from '@/lib/models'

// Mark route as dynamic
export const dynamic = 'force-dynamic'

// List of valid TEST CODES
const VALID_TEST_CODES = [
  '3PH',
  'ASIG',
  'DMU',
  'EMU',
  'ETR',
  'GHC',
  'MEMU',
  'MEMU3PH',
  'PME',
  'RDE',
  'RDMU',
  'REFD',
  'REFE',
  'REFSC',
  'REFT',
  'REMU',
  'RMEMU',
  'SFCM',
  'TRN18',
  'WAG12',
  'WDG6G',
]

// POST: Create courses for TEST CODES and manage them
export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()
    const { action } = body

    if (action === 'create') {
      // Delete all existing batch assignments first
      const deleteResult = await BatchAssignment.deleteMany({})
      console.log(`Deleted ${deleteResult.deletedCount} existing batch assignments`)

      // Create placeholder batch assignments for each TEST CODE
      // This will create courses for each TEST CODE
      const currentYear = new Date().getFullYear()
      const placeholderAssignments = []

      for (const testCode of VALID_TEST_CODES) {
        // Create a placeholder batch assignment for each TEST CODE
        // Using the TEST CODE as the course name
        placeholderAssignments.push({
          excelId: `test-code-${testCode.toLowerCase()}-${currentYear}`,
          crewCourseId: `placeholder-test-code-${testCode.toLowerCase()}`,
          batchNumber: 1,
          classNumber: 1,
          station: {
            id: 'default',
            name: 'Default Station',
            code: 'DEF',
          },
          course: {
            name: testCode, // Use TEST CODE as course name
            timing: '9:00 AM - 5:00 PM',
            batchMonths: ['January', 'February'],
            batchYear: currentYear,
          },
          assignedAt: new Date(),
          alertSent: false,
          alertCount: 0,
        })
      }

      // Insert all placeholder assignments
      if (placeholderAssignments.length > 0) {
        await BatchAssignment.insertMany(placeholderAssignments)
        console.log(`Created ${placeholderAssignments.length} placeholder courses for TEST CODES`)
      }

      return NextResponse.json({
        success: true,
        message: `Created courses for ${VALID_TEST_CODES.length} TEST CODES`,
        deletedCount: deleteResult.deletedCount,
        createdCount: placeholderAssignments.length,
        testCodes: VALID_TEST_CODES,
        courses: placeholderAssignments.map(a => a.course.name),
        note: 'Courses have been created. They will appear in the courses list. When you upload Excel files, they will be associated with the appropriate TEST CODE courses.',
      })
    }

    if (action === 'delete-all') {
      // Delete all batch assignments (this will remove all courses since they're derived from batch assignments)
      const deleteResult = await BatchAssignment.deleteMany({})
      console.log(`Deleted ${deleteResult.deletedCount} batch assignments`)
      
      // Get distinct test codes from crew_courses for reference
      const distinctTestCodes = await CrewCourse.distinct('test.testCode')
      
      return NextResponse.json({
        success: true,
        message: 'All courses deleted successfully',
        deletedCount: deleteResult.deletedCount,
        testCodes: {
          valid: VALID_TEST_CODES,
          foundInDatabase: distinctTestCodes,
          matching: distinctTestCodes.filter(code => VALID_TEST_CODES.includes(code)),
          missing: VALID_TEST_CODES.filter(code => !distinctTestCodes.includes(code)),
        },
        note: 'All courses have been removed. Courses will be recreated when you upload Excel files and create batch assignments. Courses are derived from BatchAssignment documents grouped by course name.',
      })
    }

    if (action === 'list') {
      // Get distinct test codes from crew_courses
      const distinctTestCodes = await CrewCourse.distinct('test.testCode')
      
      // Get current batch assignments to see which course names exist
      const batchAssignments = await BatchAssignment.find({}).lean()
      const coursesWithAssignments = new Set(
        batchAssignments.map((assignment: any) => assignment.course.name)
      )
      
      return NextResponse.json({
        success: true,
        testCodes: {
          valid: VALID_TEST_CODES,
          foundInDatabase: distinctTestCodes,
          matching: distinctTestCodes.filter(code => VALID_TEST_CODES.includes(code)),
          missing: VALID_TEST_CODES.filter(code => !distinctTestCodes.includes(code)),
          extra: distinctTestCodes.filter(code => !VALID_TEST_CODES.includes(code)),
        },
        courses: {
          currentCourses: Array.from(coursesWithAssignments),
          count: coursesWithAssignments.size,
        },
        counts: {
          valid: VALID_TEST_CODES.length,
          inDatabase: distinctTestCodes.length,
          matching: distinctTestCodes.filter(code => VALID_TEST_CODES.includes(code)).length,
        },
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action',
      validActions: ['create', 'delete-all', 'list'],
    }, { status: 400 })
  } catch (error: any) {
    console.error('Error in courses init API:', error)
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

// GET: Get list of valid TEST CODES and their status
export async function GET() {
  try {
    await connectDB()

    // Get distinct test codes from crew_courses
    const distinctTestCodes = await CrewCourse.distinct('test.testCode')
    
    // Get current batch assignments to see which test codes have courses
    const batchAssignments = await BatchAssignment.find({}).lean()
    const coursesWithAssignments = new Set(
      batchAssignments.map((assignment: any) => assignment.course.name)
    )

    return NextResponse.json({
      success: true,
      validTestCodes: VALID_TEST_CODES,
      testCodesInDatabase: distinctTestCodes,
      coursesWithAssignments: Array.from(coursesWithAssignments),
      status: {
        validCount: VALID_TEST_CODES.length,
        inDatabaseCount: distinctTestCodes.length,
        matchingCount: distinctTestCodes.filter(code => VALID_TEST_CODES.includes(code)).length,
        missingFromDatabase: VALID_TEST_CODES.filter(code => !distinctTestCodes.includes(code)),
        coursesCount: coursesWithAssignments.size,
      },
    })
  } catch (error: any) {
    console.error('Error fetching test codes:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch test codes',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
