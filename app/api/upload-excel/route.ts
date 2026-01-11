import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import connectDB from '@/lib/mongodb'
import { ExcelFile, CrewCourse, BatchAssignment } from '@/lib/models'
import { parseCrewId } from '@/lib/crewIdParser'
import { v4 as uuidv4 } from 'uuid'
import { assignBatchesAndClasses } from '@/lib/batchAssignment'
import mongoose from 'mongoose'

// Mark route as dynamic
export const dynamic = 'force-dynamic'

interface ExcelRow {
  [key: string]: any
}

/**
 * Parse date string in various formats (DD-MM-YYYY, DD/MM/YYYY, YYYY-MM-DD, etc.)
 * @param dateString - Date string to parse
 * @returns Parsed Date object or null if invalid
 */
function parseDateString(dateString: string): Date | null {
  if (!dateString || typeof dateString !== 'string') {
    return null
  }

  const trimmed = dateString.trim()
  if (!trimmed) return null

  // Try standard Date parsing first (works for ISO format and some others)
  const standardParse = new Date(trimmed)
  if (!isNaN(standardParse.getTime()) && standardParse.getFullYear() >= 1900 && standardParse.getFullYear() <= 2100) {
    return standardParse
  }

  // Try DD-MM-YYYY or DD/MM/YYYY format
  const ddmmyyyyPattern = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/
  const match = trimmed.match(ddmmyyyyPattern)
  if (match) {
    const day = parseInt(match[1], 10)
    const month = parseInt(match[2], 10) - 1 // JavaScript months are 0-indexed
    const year = parseInt(match[3], 10)
    if (day >= 1 && day <= 31 && month >= 0 && month <= 11 && year >= 1900 && year <= 2100) {
      const date = new Date(year, month, day)
      // Verify the date is valid (e.g., not 31 Feb)
      if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
        return date
      }
    }
  }

  // Try YYYY-MM-DD format
  const yyyymmddPattern = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/
  const yyyyMatch = trimmed.match(yyyymmddPattern)
  if (yyyyMatch) {
    const year = parseInt(yyyyMatch[1], 10)
    const month = parseInt(yyyyMatch[2], 10) - 1
    const day = parseInt(yyyyMatch[3], 10)
    if (day >= 1 && day <= 31 && month >= 0 && month <= 11 && year >= 1900 && year <= 2100) {
      const date = new Date(year, month, day)
      if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
        return date
      }
    }
  }

  return null
}

/**
 * Calculate and assign time windows for batch assignments
 * This calculates assignedTimeFrom and assignedTimeTo based on:
 * - Each assignment's own crew course due date
 * - CLASS TIME TO = the due date from Excel
 * - CLASS TIME FROM = due date - 30 days
 * 
 * @param excelId - The Excel file ID to process batch assignments for
 */
async function calculateAndAssignTimeWindows(excelId: string): Promise<void> {
  try {
    // Fetch all batch assignments for this excelId that don't have assigned times yet
    const batchAssignments = await BatchAssignment.find({
      excelId,
      $or: [
        { assignedTimeFrom: { $exists: false } },
        { assignedTimeFrom: null },
      ],
    }).lean()

    if (batchAssignments.length === 0) {
      console.log('No batch assignments found to calculate time windows for')
      return
    }

    // Get all unique crewCourseIds and convert to ObjectId for querying
    const crewCourseIds = Array.from(new Set(batchAssignments.map(a => a.crewCourseId).filter(id => id && id.trim() !== '')))
    
    if (crewCourseIds.length === 0) {
      console.warn('No valid crewCourseIds found in batch assignments')
      return
    }

    const crewCourseObjectIds = crewCourseIds
      .map(id => {
        try {
          // Handle both string ObjectIds and already converted ObjectIds
          if (mongoose.Types.ObjectId.isValid(id)) {
            return new mongoose.Types.ObjectId(id)
          }
          console.warn(`Invalid ObjectId format: ${id}`)
          return null
        } catch (error) {
          console.warn(`Error converting ObjectId: ${id}`, error)
          return null
        }
      })
      .filter((id): id is mongoose.Types.ObjectId => id !== null)

    if (crewCourseObjectIds.length === 0) {
      console.warn('No valid ObjectIds could be created from crewCourseIds')
      return
    }

    // Fetch corresponding CrewCourses to get due dates
    const crewCourses = await CrewCourse.find({
      _id: { $in: crewCourseObjectIds },
    }).lean()

    if (crewCourses.length === 0) {
      console.warn('No CrewCourses found for the given IDs')
      return
    }

    // Create a map for quick lookup: crewCourseId -> dueDate
    const dueDateMap = new Map<string, Date>()
    crewCourses.forEach(cc => {
      if (!cc || !cc._id || !cc.test || !cc.test.dueDate) {
        console.warn('Invalid CrewCourse structure:', cc)
        return
      }
      const id = cc._id.toString()
      try {
        const dueDate = new Date(cc.test.dueDate)
        if (isNaN(dueDate.getTime())) {
          console.warn(`Invalid due date for CrewCourse ${id}:`, cc.test.dueDate)
          return
        }
        dueDateMap.set(id, dueDate)
      } catch (error) {
        console.warn(`Error processing CrewCourse ${id}:`, error)
      }
    })

    // Calculate assigned time windows for each batch assignment
    // Each assignment uses its own crew course's due date
    const updates: Array<{
      updateOne: {
        filter: { _id: any }
        update: { $set: { assignedTimeFrom: Date; assignedTimeTo: Date } }
      }
    }> = []

    for (const assignment of batchAssignments) {
      // Get the due date for this specific crew course
      const dueDate = dueDateMap.get(assignment.crewCourseId)
      if (!dueDate) {
        console.warn(`No due date found for crew course: ${assignment.crewCourseId}`)
        continue
      }

      // CLASS TIME TO = the due date from Excel (set to start of day)
      const assignedTimeTo = new Date(dueDate)
      assignedTimeTo.setHours(0, 0, 0, 0)

      // CLASS TIME FROM = due date - 30 days
      const assignedTimeFrom = new Date(dueDate)
      assignedTimeFrom.setDate(assignedTimeFrom.getDate() - 30)
      assignedTimeFrom.setHours(0, 0, 0, 0)

      updates.push({
        updateOne: {
          filter: { _id: assignment._id },
          update: {
            $set: {
              assignedTimeFrom,
              assignedTimeTo,
            },
          },
        },
      })
    }

    // Bulk update all batch assignments
    if (updates.length > 0) {
      try {
        await BatchAssignment.bulkWrite(updates, { ordered: false }) // ordered: false to continue on errors
        console.log(`Updated ${updates.length} batch assignments with assigned time windows`)
      } catch (bulkError: any) {
        console.error('Error in bulkWrite for assigned time windows:', bulkError)
        // Try updating individually to see which ones fail
        let successCount = 0
        for (const update of updates) {
          try {
            await BatchAssignment.updateOne(update.updateOne.filter, update.updateOne.update)
            successCount++
          } catch (individualError: any) {
            console.error(`Failed to update batch assignment ${update.updateOne.filter._id}:`, individualError)
          }
        }
        console.log(`Updated ${successCount} out of ${updates.length} batch assignments with assigned time windows`)
      }
    } else {
      console.log('No batch assignments to update with time windows')
    }
  } catch (error: any) {
    console.error('Error in calculateAndAssignTimeWindows:', error)
    // Don't throw - let the upload continue even if time calculation fails
    // This prevents the entire upload from failing due to time calculation issues
  }
}

export async function POST(request: NextRequest) {
  try {
    // Connect to MongoDB
    await connectDB()

    const formData = await request.formData()
    const file = formData.get('file') as File
    const uploadedBy = formData.get('uploadedBy') as string || 'admin'
    const sheetName = formData.get('sheetName') as string
    const stationId = formData.get('stationId') as string
    const stationName = formData.get('stationName') as string
    const stationCode = formData.get('stationCode') as string
    const courseName = formData.get('courseName') as string
    const courseTiming = formData.get('courseTiming') as string
    const numberOfBatches = parseInt(formData.get('numberOfBatches') as string) || 1
    const membersPerClass = parseInt(formData.get('membersPerClass') as string) || 0
    const totalMembers = parseInt(formData.get('totalMembers') as string) || 0
    const batchMonths = formData.get('batchMonths') as string
    const batchYear = parseInt(formData.get('batchYear') as string) || new Date().getFullYear()

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!sheetName) {
      return NextResponse.json(
        { error: 'Sheet name is required' },
        { status: 400 }
      )
    }

    if (!stationId || !stationName || !stationCode) {
      return NextResponse.json(
        { error: 'Station information is required' },
        { status: 400 }
      )
    }

    // Use defaults if courseName or courseTiming are not provided (when config step is disabled)
    const finalCourseName = courseName || `Course ${new Date().toISOString().split('T')[0]}`
    const finalCourseTiming = courseTiming || '9:00 AM - 5:00 PM'

    const excelName = file.name
    const uploadTimestamp = new Date().toISOString()

    // Always generate a new excelId for each upload to track separate uploads
    // This allows tracking which Excel file each record came from
    const excelId = uuidv4()
    console.log(`Creating new excelId: ${excelId} for file: ${excelName} (uploaded at ${uploadTimestamp})`)

    // Read the file as buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Parse Excel file - use the selected sheet
    let workbook, worksheet, data: ExcelRow[]
    try {
      workbook = XLSX.read(buffer, { type: 'buffer' })
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        return NextResponse.json(
          { error: 'Excel file has no sheets' },
          { status: 400 }
        )
      }
      
      // Use the selected sheet name
      if (!workbook.SheetNames.includes(sheetName)) {
        return NextResponse.json(
          { error: `Sheet "${sheetName}" not found in Excel file` },
          { status: 400 }
        )
      }
      
      worksheet = workbook.Sheets[sheetName]
      if (!worksheet) {
        return NextResponse.json(
          { error: `Sheet "${sheetName}" is empty or invalid` },
          { status: 400 }
        )
      }
      data = XLSX.utils.sheet_to_json(worksheet, { defval: '' })
      console.log(`Parsed ${data.length} rows from sheet "${sheetName}"`)
    } catch (parseError: any) {
      console.error('Excel parsing error:', parseError)
      return NextResponse.json(
        { error: 'Failed to parse Excel file', details: parseError.message },
        { status: 400 }
      )
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Excel file is empty or has no data rows' },
        { status: 400 }
      )
    }

    // Get all possible column names from first row
    const firstRow = data[0] || {}
    if (!firstRow || Object.keys(firstRow).length === 0) {
      return NextResponse.json(
        { error: 'Excel file has no column headers. Please ensure the first row contains column names.' },
        { status: 400 }
      )
    }
    const allKeys = Object.keys(firstRow)
    console.log('Available columns in Excel:', allKeys)

    // Normalize column names (case-insensitive matching)
    const normalizeKey = (key: string, possibleKeys: string[]): string | null => {
      if (!key) return null
      const lowerKey = key.toLowerCase().trim().replace(/\s+/g, ' ')
      for (const possibleKey of possibleKeys) {
        const lowerPossible = possibleKey.toLowerCase().trim()
        if (lowerKey === lowerPossible ||
            lowerKey.replace(/\s+/g, '') === lowerPossible.replace(/\s+/g, '') ||
            lowerKey.replace(/[_\-\s]+/g, '') === lowerPossible.replace(/[_\-\s]+/g, '') ||
            lowerKey.includes(lowerPossible) || lowerPossible.includes(lowerKey)) {
          return key
        }
      }
      return null
    }

    // Find column mappings
    const crewIdKey = allKeys.find(k => 
      normalizeKey(k, [
        'crew id', 'crewid', 'crew_id', 'crew code',
        'station code', 'stationcode', 'station_code', 'station',
        'code', 'employee code', 'staff code'
      ])
    ) || allKeys.find(k => {
      const lower = k.toLowerCase()
      return (lower.includes('crew') && lower.includes('id')) ||
             (lower.includes('station') && lower.includes('code')) ||
             lower === 'code' || lower === 'station' || lower === 'crew'
    }) || null

    const crewNameKey = allKeys.find(k => 
      normalizeKey(k, [
        'name', 'member name', 'membername', 'member_name',
        'full name', 'fullname', 'full_name', 'employee name',
        'staff name', 'person name', 'worker name', 'crew name', 'crewname'
      ])
    ) || allKeys.find(k => {
      const lower = k.toLowerCase()
      return lower.includes('name') && 
             !lower.includes('file') &&
             !lower.includes('user') &&
             !lower.includes('login')
    }) || null

    const designationKey = allKeys.find(k => 
      normalizeKey(k, ['designation', 'designation code', 'designationcode', 'designation_code', 'role', 'position'])
    ) || null

    const testCodeKey = allKeys.find(k => 
      normalizeKey(k, ['test code', 'testcode', 'test_code', 'test', 'course code', 'coursecode'])
    ) || null

    const dueDateKey = allKeys.find(k => 
      normalizeKey(k, ['due date', 'duedate', 'due_date', 'deadline', 'test date', 'testdate'])
    ) || null

    const testStatusKey = allKeys.find(k => 
      normalizeKey(k, ['test status', 'teststatus', 'test_status', 'status', 'test result', 'testresult'])
    ) || null

    const reasonKey = allKeys.find(k => 
      normalizeKey(k, ['reason', 'remarks', 'note', 'notes', 'comment', 'comments'])
    ) || null

    console.log('Column mappings:', {
      crewIdKey,
      crewNameKey,
      designationKey,
      testCodeKey,
      dueDateKey,
      testStatusKey,
      reasonKey,
    })

    if (!crewIdKey) {
      return NextResponse.json(
        { error: `Crew ID column not found. Available columns: ${allKeys.join(', ')}` },
        { status: 400 }
      )
    }

    if (!crewNameKey) {
      return NextResponse.json(
        { error: `Crew Name column not found. Available columns: ${allKeys.join(', ')}` },
        { status: 400 }
      )
    }

    // Parse rows and create crew_courses documents
    const crewCoursesToInsert: Array<{
      excelId: string
      division: {
        code: string
      }
      crew: {
        crewId: string
        crewName: string
      }
      designation: {
        code: string
      }
      test: {
        testCode: string
        dueDate: Date
      }
      status: string
      reason?: string
      createdAt: Date
    }> = []

    const errors: Array<{ row: number; message: string }> = []
    const warnings: Array<{ row: number; message: string }> = []

    data.forEach((row, index) => {
      const rowNumber = index + 2 // Excel row number (1-indexed, +1 for header)

      // Get full crew ID (e.g., "MAS1456")
      const fullCrewId = row[crewIdKey]?.toString().trim() || ''
      if (!fullCrewId) {
        errors.push({ row: rowNumber, message: 'Missing Crew ID' })
        return
      }

      // CRITICAL: Parse crewId to extract division code and numeric crewId
      const parsed = parseCrewId(fullCrewId)
      if (!parsed) {
        errors.push({ row: rowNumber, message: `Invalid Crew ID format: ${fullCrewId}` })
        return
      }

      const { divisionCode, crewId } = parsed

      // Get crew name
      const crewName = row[crewNameKey]?.toString().trim() || ''
      if (!crewName) {
        warnings.push({ row: rowNumber, message: 'Crew Name is missing' })
      }

      // Get designation code
      const designationCode = (designationKey ? row[designationKey]?.toString().trim() : '') || 'UNKNOWN'
      
      // Get test code
      const testCode = (testCodeKey ? row[testCodeKey]?.toString().trim() : '') || `TEST-${index + 1}`
      
      // Get due date
      let dueDate: Date
      if (dueDateKey && row[dueDateKey]) {
        const dateValue = row[dueDateKey]
        if (dateValue instanceof Date) {
          dueDate = dateValue
        } else if (typeof dateValue === 'number') {
          // Excel date serial number (days since 1900-01-01)
          try {
            // Excel epoch is 1899-12-30 (not 1900-01-01 due to Excel bug)
            const excelEpoch = new Date(1899, 11, 30)
            dueDate = new Date(excelEpoch.getTime() + dateValue * 86400000)
            if (isNaN(dueDate.getTime()) || dueDate.getFullYear() < 1900 || dueDate.getFullYear() > 2100) {
              dueDate = new Date()
              warnings.push({ row: rowNumber, message: 'Invalid Excel date, using today' })
            }
          } catch {
            dueDate = new Date()
            warnings.push({ row: rowNumber, message: 'Invalid date format, using today' })
          }
        } else if (typeof dateValue === 'string') {
          // Try to parse string date using improved parser
          const parsed = parseDateString(dateValue)
          if (parsed) {
            dueDate = parsed
          } else {
            // If parseDateString fails, try standard Date parsing as fallback
            const standardParse = new Date(dateValue)
            if (!isNaN(standardParse.getTime()) && standardParse.getFullYear() >= 1900 && standardParse.getFullYear() <= 2100) {
              dueDate = standardParse
            } else {
              dueDate = new Date()
              warnings.push({ row: rowNumber, message: 'Invalid date string, using today' })
            }
          }
        } else {
          dueDate = new Date()
          warnings.push({ row: rowNumber, message: 'Due date missing, using today' })
        }
      } else {
        dueDate = new Date()
        warnings.push({ row: rowNumber, message: 'Due date missing, using today' })
      }

      // Get test status
      const testStatus = (testStatusKey ? row[testStatusKey]?.toString().trim() : '') || 'PENDING'

      // Get reason (optional)
      const reason = (reasonKey ? row[reasonKey]?.toString().trim() : '') || undefined

      // Create crew course document with separated division and crewId
      crewCoursesToInsert.push({
        excelId,
        division: {
          code: divisionCode,
        },
        crew: {
          crewId: crewId, // numeric part only (e.g., "1456")
          crewName: crewName || 'Unknown',
        },
        designation: {
          code: designationCode.toUpperCase(),
        },
        test: {
          testCode: testCode.toUpperCase(),
          dueDate,
        },
        status: testStatus.toUpperCase(),
        reason: reason,
        createdAt: new Date(),
      })
    })

    if (crewCoursesToInsert.length === 0) {
      return NextResponse.json(
        { error: 'No valid rows found in Excel file' },
        { status: 400 }
      )
    }

    // Check for duplicate content by comparing with existing crew courses
    // Create content signatures for comparison (crewId + division + testCode + dueDate)
    const createContentSignature = (course: typeof crewCoursesToInsert[0]) => {
      const dueDateStr = course.test.dueDate instanceof Date 
        ? course.test.dueDate.toISOString().split('T')[0] 
        : new Date(course.test.dueDate).toISOString().split('T')[0]
      return `${course.division.code}-${course.crew.crewId}-${course.test.testCode}-${dueDateStr}`.toUpperCase()
    }

    const newContentSignatures = new Set(
      crewCoursesToInsert.map(createContentSignature)
    )

    // Get all existing crew courses to compare
    const existingCrewCourses = await CrewCourse.find({}).lean()
    const existingSignatures = new Set(
      existingCrewCourses.map((course: any) => {
        const dueDateStr = course.test.dueDate instanceof Date
          ? course.test.dueDate.toISOString().split('T')[0]
          : new Date(course.test.dueDate).toISOString().split('T')[0]
        return `${course.division.code}-${course.crew.crewId}-${course.test.testCode}-${dueDateStr}`.toUpperCase()
      })
    )

    // Check if all new content already exists (exact duplicate)
    const allDuplicates = Array.from(newContentSignatures).every(sig => existingSignatures.has(sig))
    
    // Find new content (signatures that don't exist)
    const newSignatures = Array.from(newContentSignatures).filter(sig => !existingSignatures.has(sig))
    const duplicateSignatures = Array.from(newContentSignatures).filter(sig => existingSignatures.has(sig))

    // Filter crew courses: keep only new ones (remove duplicates)
    const newCrewCourses = crewCoursesToInsert.filter(course => {
      const sig = createContentSignature(course)
      return !existingSignatures.has(sig)
    })

    // If all content is duplicate, inform admin
    if (allDuplicates && existingCrewCourses.length > 0) {
      return NextResponse.json({
        success: false,
        isDuplicate: true,
        message: `The uploaded Excel file contains the same content as existing data. All ${crewCoursesToInsert.length} records already exist in the database.`,
        data: {
          totalRecords: crewCoursesToInsert.length,
          duplicateRecords: duplicateSignatures.length,
          newRecords: 0,
        },
      }, { status: 200 }) // Status 200 so it's not treated as error, but shows the duplicate message
    }

    // Save excel_files document (always create new entry for each upload)
    const excelFileData = {
      excelId,
      excelName,
      uploadedAt: new Date(),
      uploadedBy,
      totalRecords: newCrewCourses.length > 0 ? newCrewCourses.length : crewCoursesToInsert.length,
      status: 'ACTIVE' as const,
    }

    await ExcelFile.create(excelFileData)
    console.log(`Created Excel file record: ${excelName} with excelId: ${excelId}`)

    // Insert only new crew_courses (skip duplicates) - APPEND mode, never delete existing
    let insertedCount = 0
    if (newCrewCourses.length > 0) {
      await CrewCourse.insertMany(newCrewCourses)
      insertedCount = newCrewCourses.length
      console.log(`Successfully appended ${insertedCount} new crew courses to database (existing records preserved)`)
    } else {
      console.log('No new records to insert (all were duplicates) - existing records preserved')
    }

    // Prepare response with duplicate detection info
    const hasNewContent = newCrewCourses.length > 0
    const hasDuplicates = duplicateSignatures.length > 0

    // Automatically assign batches and classes after upload (only if new content was added)
    // Group by TEST CODE and assign batches for each TEST CODE
    const batchAssignmentResults: any[] = []
    let totalAssigned = 0
    
    if (hasNewContent) {
      try {
        // Group crew courses by TEST CODE
        const crewCoursesByTestCode = new Map<string, typeof newCrewCourses>()
        
        // First, fetch the inserted crew courses to get their IDs and test codes
        const insertedCrewCourses = await CrewCourse.find({ excelId }).lean()
        
        // Group by TEST CODE
        insertedCrewCourses.forEach((course: any) => {
          const testCode = course.test?.testCode || 'UNKNOWN'
          if (!crewCoursesByTestCode.has(testCode)) {
            crewCoursesByTestCode.set(testCode, [])
          }
          // Store the course ID for batch assignment
          crewCoursesByTestCode.get(testCode)!.push(course)
        })

        console.log(`Grouped crew courses into ${crewCoursesByTestCode.size} TEST CODE groups`)

        // For each TEST CODE, assign batches and classes
        // Use TEST CODE as the course name
        for (const [testCode, coursesForTestCode] of Array.from(crewCoursesByTestCode.entries())) {
          try {
            const result = await assignBatchesAndClasses({
              excelId,
              testCode, // Filter by test code
              station: {
                id: stationId,
                name: stationName,
                code: stationCode,
              },
              course: {
                name: testCode, // Use TEST CODE as course name
                timing: finalCourseTiming,
                numberOfBatches,
                membersPerClass,
                batchMonths: batchMonths ? JSON.parse(batchMonths) : [],
                batchYear,
              },
            })

            if (result.success) {
              batchAssignmentResults.push({
                testCode,
                ...result,
              })
              totalAssigned += result.totalAssigned
              console.log(`Batch assignment completed for TEST CODE ${testCode}:`, result)
            }
          } catch (testCodeError: any) {
            console.error(`Error assigning batches for TEST CODE ${testCode}:`, testCodeError)
            // Continue with other test codes even if one fails
          }
        }

        // Calculate and assign time windows for all batch assignments
        // Classes are assigned for a 30-day period starting from the first day of the first batch month
        // Can be easily modified for rescheduling functionality in the future
        try {
          await calculateAndAssignTimeWindows(excelId)
          console.log(`Assigned time windows calculated for all batch assignments (30-day period from start of batch month)`)
        } catch (timeCalcError: any) {
          console.error('Error calculating assigned time windows:', timeCalcError)
          // Don't fail the upload if time calculation fails
        }

        // Automatically trigger class scheduling algorithm after batch assignment
        if (totalAssigned > 0) {
          try {
            const { scheduleClassesForUsers } = await import('@/lib/classScheduling')
            const schedulingResult = await scheduleClassesForUsers()
            
            console.log('Class scheduling completed:', {
              scheduled: schedulingResult.scheduled,
              failed: schedulingResult.failed,
              errors: schedulingResult.errors,
            })
          } catch (schedulingError: any) {
            console.error('Error scheduling classes:', schedulingError)
            // Don't fail the upload if scheduling fails - it can be done manually later
          }
        }
      } catch (batchError: any) {
        console.error('Error assigning batches:', batchError)
        // Don't fail the upload if batch assignment fails
      }
    }
    
    // Create a combined batch assignment result
    const batchAssignmentResult = batchAssignmentResults.length > 0 ? {
      success: true,
      totalAssigned,
      batches: batchAssignmentResults.flatMap(r => r.batches || []),
      testCodeResults: batchAssignmentResults,
    } : null

    // Build response message based on content status
    let responseMessage = ''
    if (hasNewContent && hasDuplicates) {
      responseMessage = `Successfully uploaded ${insertedCount} new records. ${duplicateSignatures.length} duplicate record(s) were skipped.`
    } else if (hasNewContent) {
      responseMessage = `Successfully uploaded ${insertedCount} new records from file: ${excelName}`
    } else {
      responseMessage = `Upload completed. No new records to add (all ${crewCoursesToInsert.length} records already exist).`
    }

    return NextResponse.json({
      success: true,
      message: responseMessage,
      isDuplicate: !hasNewContent && hasDuplicates,
      hasNewContent,
      hasDuplicates,
      data: {
        excelId,
        excelName,
        sheetName,
        station: {
          id: stationId,
          name: stationName,
          code: stationCode,
        },
        course: {
          name: finalCourseName,
          timing: finalCourseTiming,
          numberOfBatches,
          membersPerClass,
          batchMonths: batchMonths ? JSON.parse(batchMonths) : [],
          batchYear,
        },
        totalRecords: crewCoursesToInsert.length,
        newRecords: insertedCount,
        duplicateRecords: duplicateSignatures.length,
        totalMembers,
        excelUploadTime: uploadTimestamp,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
        summary: {
          totalRows: data.length,
          successfulRows: crewCoursesToInsert.length,
          newRows: insertedCount,
          duplicateRows: duplicateSignatures.length,
          errorRows: errors.length,
          warningRows: warnings.length,
        },
        batchAssignment: batchAssignmentResult || null,
        note: 'Existing users in database were preserved. Only new unique records were added.',
      },
    })
  } catch (error: any) {
    console.error('Error processing Excel file:', error)
    console.error('Error stack:', error.stack)

    let errorMessage = 'Failed to process Excel file'
    let errorDetails = error.message || 'Unknown error'

    if (error.message?.includes('connection') || error.message?.includes('Mongo')) {
      errorMessage = 'Database connection error'
      errorDetails = 'Unable to connect to MongoDB. Please check your connection string.'
    } else if (error.message?.includes('parse') || error.message?.includes('Excel')) {
      errorMessage = 'Excel file parsing error'
      errorDetails = error.message
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
