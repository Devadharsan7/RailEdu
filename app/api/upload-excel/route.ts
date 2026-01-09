import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { initDatabase, dbDivisions, dbStations, dbUsers } from '@/lib/db'

interface ExcelRow {
  [key: string]: any
}

interface ParsedMember {
  id: string
  name: string
  email?: string
  phone?: string
  crewId: string
  role?: string
  status: 'Active' | 'Inactive'
  joinDate: string
}

export async function POST(request: NextRequest) {
  try {
    // Initialize database tables if they don't exist (with error handling)
    try {
      await initDatabase()
    } catch (dbInitError: any) {
      console.error('Database initialization error (continuing anyway):', dbInitError.message)
      // Continue processing even if DB init fails - we'll handle it later
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const divisionId = formData.get('divisionId') as string
    const divisionName = formData.get('divisionName') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!divisionId || !divisionName) {
      return NextResponse.json(
        { error: 'Division selection is required' },
        { status: 400 }
      )
    }

    // Get or create division (with error handling)
    const divisionCode = divisionName.substring(0, 3).toUpperCase() // Extract code from name or use first 3 letters
    try {
      await dbDivisions.create(divisionId, divisionName, divisionCode)
    } catch (dbError: any) {
      console.error('Database error creating division:', dbError.message)
      // Continue processing - we'll try to save later
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

    // Map of crew IDs to station names (you can expand this)
    const stationCodeMap: { [key: string]: { name: string; code: string } } = {
      'MAS': { name: 'Chennai Central', code: 'MAS' },
      'MS': { name: 'Chennai Egmore', code: 'MS' },
      'TBM': { name: 'Tambaram', code: 'TBM' },
      'MDU': { name: 'Madurai Junction', code: 'MDU' },
      'TEN': { name: 'Tirunelveli Junction', code: 'TEN' },
      'DG': { name: 'Dindigul', code: 'DG' },
      'SA': { name: 'Salem Junction', code: 'SA' },
      'ED': { name: 'Erode Junction', code: 'ED' },
      'CBE': { name: 'Coimbatore Junction', code: 'CBE' },
      'TPJ': { name: 'Tiruchirappalli Junction', code: 'TPJ' },
      'TJ': { name: 'Thanjavur Junction', code: 'TJ' },
      'KMU': { name: 'Kumbakonam', code: 'KMU' },
      'PGT': { name: 'Palakkad Junction', code: 'PGT' },
      'SRR': { name: 'Shoranur Junction', code: 'SRR' },
      'OTP': { name: 'Ottapalam', code: 'OTP' },
      'TVC': { name: 'Thiruvananthapuram Central', code: 'TVC' },
      'QLN': { name: 'Kollam Junction', code: 'QLN' },
      'ALLP': { name: 'Alappuzha', code: 'ALLP' },
      'AVD': { name: 'Arakkonam', code: 'AVD' },
    }

    // Parse members from Excel with validation
    const parsedMembers: ParsedMember[] = []
    const crewIdGroups: { [crewId: string]: ParsedMember[] } = {}
    const errors: Array<{ row: number; message: string }> = []
    const warnings: Array<{ row: number; message: string }> = []

    // Normalize column names (case-insensitive matching with fuzzy matching)
    const normalizeKey = (key: string, possibleKeys: string[]): string | null => {
      if (!key) return null
      const lowerKey = key.toLowerCase().trim().replace(/\s+/g, ' ')
      for (const possibleKey of possibleKeys) {
        const lowerPossible = possibleKey.toLowerCase().trim()
        // Exact match
        if (lowerKey === lowerPossible) {
          return key
        }
        // Match with spaces removed
        if (lowerKey.replace(/\s+/g, '') === lowerPossible.replace(/\s+/g, '')) {
          return key
        }
        // Match with underscores/hyphens
        if (lowerKey.replace(/[_\-\s]+/g, '') === lowerPossible.replace(/[_\-\s]+/g, '')) {
          return key
        }
        // Partial match (contains the key)
        if (lowerKey.includes(lowerPossible) || lowerPossible.includes(lowerKey)) {
          return key
        }
      }
      return null
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
    console.log('First row sample:', JSON.stringify(firstRow, null, 2).substring(0, 500))
    
    // Find column mappings (try multiple variations with fallback)
    const crewIdKey = allKeys.find(k => 
      normalizeKey(k, [
        'crew id', 'crewid', 'crew_id', 'crew code',
        'station code', 'stationcode', 'station_code', 'station',
        'code', 'crew code', 'employee code', 'staff code'
      ])
    ) || allKeys.find(k => {
      const lower = k.toLowerCase()
      return (lower.includes('crew') && lower.includes('id')) ||
             (lower.includes('station') && lower.includes('code')) ||
             lower === 'code' || lower === 'station' || lower === 'crew'
    }) || null
    
    const nameKey = allKeys.find(k => 
      normalizeKey(k, [
        'name', 'member name', 'membername', 'member_name',
        'full name', 'fullname', 'full_name', 'employee name',
        'staff name', 'person name', 'worker name'
      ])
    ) || allKeys.find(k => {
      const lower = k.toLowerCase()
      return lower.includes('name') && 
             !lower.includes('file') &&
             !lower.includes('user') &&
             !lower.includes('login')
    }) || null
    
    const emailKey = allKeys.find(k => 
      normalizeKey(k, ['email', 'email id', 'emailid', 'email_id'])
    ) || null
    
    const phoneKey = allKeys.find(k => 
      normalizeKey(k, ['phone', 'mobile', 'phone number', 'phonenumber', 'phone_number'])
    ) || null
    
    const roleKey = allKeys.find(k => 
      normalizeKey(k, ['role', 'designation'])
    ) || null
    
    const statusKey = allKeys.find(k => 
      normalizeKey(k, ['status'])
    ) || null

    // Log available columns for debugging
    console.log('Available columns in Excel:', allKeys)
    console.log('Found crewIdKey:', crewIdKey)
    console.log('Found nameKey:', nameKey)

    if (!crewIdKey) {
      const errorMsg = `Crew ID column not found. Available columns: ${allKeys.join(', ')}. Please ensure your Excel file has a column named "Crew ID", "Station Code", or "Code"`
      console.error(errorMsg)
      return NextResponse.json(
        { error: errorMsg },
        { status: 400 }
      )
    }

    if (!nameKey) {
      const errorMsg = `Name column not found. Available columns: ${allKeys.join(', ')}. Please ensure your Excel file has a column named "Name" or "Member Name"`
      console.error(errorMsg)
      return NextResponse.json(
        { error: errorMsg },
        { status: 400 }
      )
    }

    data.forEach((row, index) => {
      const rowNumber = index + 2 // Excel row number (1-indexed, +1 for header)
      
      // Get crew ID
      const crewId = row[crewIdKey]?.toString().trim() || ''
      if (!crewId) {
        errors.push({ row: rowNumber, message: 'Missing Crew ID' })
        return
      }

      const crewIdUpper = crewId.toUpperCase()
      
      // Get member details with validation
      const name = (nameKey ? (row[nameKey]?.toString().trim() || '') : '').trim()
      if (!name || name === 'Unknown') {
        warnings.push({ row: rowNumber, message: 'Name is missing or invalid' })
      }
      
      const email = (emailKey ? (row[emailKey]?.toString().trim() || '') : '').trim()
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        warnings.push({ row: rowNumber, message: 'Invalid email format' })
      }
      
      const phone = (phoneKey ? (row[phoneKey]?.toString().trim() || '') : '').trim()
      const role = (roleKey ? (row[roleKey]?.toString().trim() || 'Crew') : 'Crew').trim()
      const statusRaw = (statusKey ? (row[statusKey]?.toString().trim() || 'Active') : 'Active').trim()
      const status = statusRaw.toLowerCase() === 'active' ? 'Active' : 'Inactive'

      // Generate unique ID based on crew ID and name (for duplicate detection)
      const uniqueId = `${divisionId}-${crewIdUpper}-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}-${index}`

      const member: ParsedMember = {
        id: uniqueId,
        name: name || 'Unknown Member',
        email: email || undefined,
        phone: phone || undefined,
        crewId: crewIdUpper,
        role: role || 'Crew',
        status: status,
        joinDate: new Date().toISOString().split('T')[0],
      }

      parsedMembers.push(member)

      // Group by crew ID
      if (!crewIdGroups[crewIdUpper]) {
        crewIdGroups[crewIdUpper] = []
      }
      crewIdGroups[crewIdUpper].push(member)
    })

    // Organize by stations and save to database
    const stationsByCrewId: { [crewId: string]: { name: string; code: string; users: ParsedMember[] } } = {}
    const usersToSave: Array<{
      id: string
      name: string
      email?: string
      phone?: string
      role?: string
      status?: string
      crewId?: string
      divisionId?: string
      stationId?: string
      joinDate?: string
    }> = []

    // Process each crew ID group
    for (const crewId of Object.keys(crewIdGroups)) {
      const stationInfo = stationCodeMap[crewId] || { name: `${crewId} Station`, code: crewId }
      const stationId = `${divisionId}-${crewId}-${Date.now()}`
      
      // Create or get station (with error handling)
      let station = null
      try {
        station = await dbStations.getByCode(divisionId, stationInfo.code)
        if (!station) {
          await dbStations.create(stationId, divisionId, stationInfo.name, stationInfo.code)
          station = { id: stationId, division_id: divisionId, name: stationInfo.name, code: stationInfo.code }
        }
      } catch (dbError: any) {
        console.error(`Database error creating station ${crewId}:`, dbError.message)
        // Create a temporary station object for processing
        station = { id: stationId, division_id: divisionId, name: stationInfo.name, code: stationInfo.code }
      }

      stationsByCrewId[crewId] = {
        name: stationInfo.name,
        code: stationInfo.code,
        users: crewIdGroups[crewId],
      }

      // Prepare users for batch insert
      crewIdGroups[crewId].forEach(member => {
        usersToSave.push({
          id: member.id,
          name: member.name,
          email: member.email || undefined,
          phone: member.phone || undefined,
          role: member.role || 'Crew',
          status: member.status,
          crewId: member.crewId,
          divisionId: divisionId,
          stationId: station.id,
          joinDate: member.joinDate,
        })
      })
    }

    // Save all users to database in batch (with error handling)
    let dbSaveSuccess = false
    if (usersToSave.length > 0) {
      try {
        await dbUsers.createBatch(usersToSave)
        dbSaveSuccess = true
      } catch (dbError: any) {
        console.error('Database error saving users:', dbError.message)
        // Continue - data is still parsed and can be returned
        // The frontend can save to localStorage as fallback
      }
    }

    return NextResponse.json({
      success: true,
      message: dbSaveSuccess 
        ? `Successfully parsed and saved ${parsedMembers.length} members to database`
        : `Successfully parsed ${parsedMembers.length} members (database save failed, using fallback)`,
      data: {
        divisionId,
        divisionName,
        totalMembers: parsedMembers.length,
        stationsCount: Object.keys(stationsByCrewId).length,
        stations: stationsByCrewId,
        members: parsedMembers,
        savedToDatabase: dbSaveSuccess,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
        summary: {
          totalRows: data.length,
          successfulRows: parsedMembers.length,
          errorRows: errors.length,
          warningRows: warnings.length,
        },
      },
    })
  } catch (error: any) {
    console.error('Error processing Excel file:', error)
    console.error('Error stack:', error.stack)
    
    // Provide more detailed error message
    let errorMessage = 'Failed to process Excel file'
    let errorDetails = error.message || 'Unknown error'
    
    // Check for specific error types
    if (error.message?.includes('DATABASE_URL')) {
      errorMessage = 'Database connection error'
      errorDetails = 'Database is not configured. Please check your DATABASE_URL environment variable.'
    } else if (error.message?.includes('ECONNREFUSED') || error.message?.includes('connection')) {
      errorMessage = 'Database connection failed'
      errorDetails = 'Unable to connect to the database. Please check your database connection settings.'
    } else if (error.message?.includes('parse') || error.message?.includes('Excel')) {
      errorMessage = 'Excel file parsing error'
      errorDetails = error.message
    } else if (error.message?.includes('column') || error.message?.includes('Column')) {
      errorMessage = 'Excel column error'
      errorDetails = error.message
    }
    
    return NextResponse.json(
      { 
        error: errorMessage, 
        details: errorDetails,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

