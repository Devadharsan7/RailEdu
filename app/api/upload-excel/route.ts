import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import connectDB from '@/lib/mongodb'
import { ExcelFile, CrewCourse } from '@/lib/models'
import { parseCrewId } from '@/lib/crewIdParser'
import { v4 as uuidv4 } from 'uuid'

interface ExcelRow {
  [key: string]: any
}

export async function POST(request: NextRequest) {
  try {
    // Connect to MongoDB
    await connectDB()

    const formData = await request.formData()
    const file = formData.get('file') as File
    const uploadedBy = formData.get('uploadedBy') as string || 'admin'

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    const excelName = file.name

    // CRITICAL: Check if Excel file already exists by excelName
    let existingExcelFile = await ExcelFile.findOne({ excelName })
    let excelId: string

    if (existingExcelFile) {
      // Reuse existing excelId
      excelId = existingExcelFile.excelId
      console.log(`Reusing existing excelId: ${excelId} for file: ${excelName}`)
    } else {
      // Generate new excelId
      excelId = uuidv4()
      console.log(`Creating new excelId: ${excelId} for file: ${excelName}`)
    }

    // Read the file as buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Parse Excel file
    let workbook, sheetName, worksheet, data: ExcelRow[]
    try {
      workbook = XLSX.read(buffer, { type: 'buffer' })
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        return NextResponse.json(
          { error: 'Excel file has no sheets' },
          { status: 400 }
        )
      }
      sheetName = workbook.SheetNames[0]
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
          // Try to parse string date
          const parsed = new Date(dateValue)
          if (!isNaN(parsed.getTime()) && parsed.getFullYear() >= 1900 && parsed.getFullYear() <= 2100) {
            dueDate = parsed
          } else {
            dueDate = new Date()
            warnings.push({ row: rowNumber, message: 'Invalid date string, using today' })
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

    // Save or update excel_files document
    const excelFileData = {
      excelId,
      excelName,
      uploadedAt: new Date(),
      uploadedBy,
      totalRecords: crewCoursesToInsert.length,
      status: 'ACTIVE' as const,
    }

    await ExcelFile.findOneAndUpdate(
      { excelId },
      excelFileData,
      { upsert: true, new: true }
    )

    // Delete existing crew_courses for this excelId (if re-uploading)
    if (existingExcelFile) {
      await CrewCourse.deleteMany({ excelId })
      console.log(`Deleted existing crew_courses for excelId: ${excelId}`)
    }

    // Insert all crew_courses documents
    await CrewCourse.insertMany(crewCoursesToInsert)

    console.log(`Successfully saved ${crewCoursesToInsert.length} crew courses to database`)

    return NextResponse.json({
      success: true,
      message: existingExcelFile
        ? `Successfully re-uploaded and updated ${crewCoursesToInsert.length} records for existing file: ${excelName}`
        : `Successfully uploaded ${crewCoursesToInsert.length} records from new file: ${excelName}`,
      data: {
        excelId,
        excelName,
        totalRecords: crewCoursesToInsert.length,
        isReupload: !!existingExcelFile,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
        summary: {
          totalRows: data.length,
          successfulRows: crewCoursesToInsert.length,
          errorRows: errors.length,
          warningRows: warnings.length,
        },
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
