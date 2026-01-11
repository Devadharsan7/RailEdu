import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { BatchAssignment } from '@/lib/models'
import { v4 as uuidv4 } from 'uuid'

// Mark route as dynamic
export const dynamic = 'force-dynamic'

// GET: Get all batch configurations
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    // For now, we'll get batch configurations from existing batch assignments
    // In the future, you might want a separate BatchConfig collection
    const batchAssignments = await BatchAssignment.find({})
      .sort({ 'course.name': 1, createdAt: -1 })
      .lean()

    // Group by course name to get unique batch configurations
    const configsMap = new Map<string, any>()

    batchAssignments.forEach((assignment: any) => {
      const courseName = assignment.course.name
      const key = `${courseName}-${assignment.course.batchYear}`

      if (!configsMap.has(key)) {
        configsMap.set(key, {
          batchId: `batch-${courseName.replace(/\s+/g, '-').toLowerCase()}-${assignment.course.batchYear}`,
          courseName,
          classesPerBatch: 0, // Will be calculated
          crewLimitPerClass: 0, // Will be calculated
          months: assignment.course.batchMonths || [],
          batchYear: assignment.course.batchYear,
          timing: assignment.course.timing,
          createdAt: assignment.assignedAt,
          updatedAt: assignment.assignedAt,
        })
      }
    })

    // Also get from localStorage batches and merge
    // For now, return configurations from batch assignments
    const configs = Array.from(configsMap.values())

    return NextResponse.json({
      success: true,
      data: configs,
      count: configs.length,
    })
  } catch (error: any) {
    console.error('Error fetching batch configs:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch batch configurations',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

// POST: Create or update batch configuration
// Creates placeholder batch assignments so they appear in courses page immediately
export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()
    const { courseName, classesPerBatch, crewLimitPerClass, months, batchYear, timing, stationId, stationName, stationCode } = body

    if (!courseName || !classesPerBatch || !crewLimitPerClass || !months || months.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: courseName, classesPerBatch, crewLimitPerClass, months' },
        { status: 400 }
      )
    }

    const year = batchYear || new Date().getFullYear()
    const batchId = `config-${courseName.replace(/\s+/g, '-').toLowerCase()}-${year}-${Date.now()}`

    // Check if there are existing batch assignments for this course configuration
    const existingAssignments = await BatchAssignment.find({
      'course.name': courseName,
      'course.batchYear': year,
    }).lean()

    // If assignments already exist with members, update their configuration
    // Otherwise, create placeholder batch structure
    if (existingAssignments.length > 0 && existingAssignments[0].crewCourseId) {
      // Update existing assignments' course info
      await BatchAssignment.updateMany(
        {
          'course.name': courseName,
          'course.batchYear': year,
        },
        {
          $set: {
            'course.batchMonths': months,
            'course.timing': timing || 'Morning',
          },
        }
      )
    } else {
      // Create placeholder batch assignments structure
      // This creates empty batch structure so course appears in courses page
      const placeholderAssignments = []
      // Create at least one batch with the specified number of classes
      const numberOfBatches = 1 // Start with 1 batch, will expand when members are assigned
      
      // Create placeholder for batch structure (will be populated when members are assigned)
      // We'll create one placeholder entry per class to show the structure
      for (let batchNum = 1; batchNum <= numberOfBatches; batchNum++) {
        for (let classNum = 1; classNum <= classesPerBatch; classNum++) {
          placeholderAssignments.push({
            excelId: `config-${batchId}`, // Config-based excelId
            crewCourseId: `placeholder-${batchId}-${batchNum}-${classNum}`, // Placeholder ID
            batchNumber: batchNum,
            classNumber: classNum,
            station: {
              id: stationId || 'default',
              name: stationName || 'Default Station',
              code: stationCode || 'DEF',
            },
            course: {
              name: courseName,
              timing: timing || 'Morning',
              batchMonths: months,
              batchYear: year,
            },
            assignedAt: new Date(),
            alertSent: false,
            alertCount: 0,
          })
        }
      }

      // Delete old placeholder assignments for this course if they exist
      await BatchAssignment.deleteMany({
        'course.name': courseName,
        'course.batchYear': year,
        excelId: { $regex: /^config-/ },
      })

      // Insert placeholder assignments
      if (placeholderAssignments.length > 0) {
        await BatchAssignment.insertMany(placeholderAssignments)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Batch configuration created successfully. Course will appear in Courses page.',
      data: {
        batchId,
        courseName,
        classesPerBatch,
        crewLimitPerClass,
        months,
        batchYear: year,
        timing: timing || 'Morning',
      },
    })
  } catch (error: any) {
    console.error('Error saving batch config:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save batch configuration',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

// DELETE: Delete batch configuration and placeholder assignments
export async function DELETE(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()
    const { courseName, batchYear } = body

    if (!courseName) {
      return NextResponse.json(
        { error: 'Missing required field: courseName' },
        { status: 400 }
      )
    }

    const year = batchYear || new Date().getFullYear()

    // Delete placeholder batch assignments for this course
    const deleteResult = await BatchAssignment.deleteMany({
      'course.name': courseName,
      'course.batchYear': year,
      excelId: { $regex: /^config-/ },
    })

    return NextResponse.json({
      success: true,
      message: 'Batch configuration deleted successfully',
      deletedCount: deleteResult.deletedCount,
    })
  } catch (error: any) {
    console.error('Error deleting batch config:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete batch configuration',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

