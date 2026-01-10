import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { CrewCourse } from '@/lib/models'

// GET distinct designations for a division - returns array of designation codes
// Example: /api/divisions/TBM/designations
// Returns: ["LPM", "MMAN", "SHT"]
export async function GET(
  request: NextRequest,
  { params }: { params: { divisionCode: string } }
) {
  try {
    await connectDB()

    const divisionCode = params.divisionCode.toUpperCase()

    // Get distinct designation codes for this division as a simple array
    const designations = await CrewCourse.distinct('designation.code', {
      'division.code': divisionCode,
    })

    // Sort alphabetically
    const sortedDesignations = designations.sort()

    return NextResponse.json({
      success: true,
      data: sortedDesignations, // Returns: ["LPM", "MMAN", "SHT"]
    })
  } catch (error: any) {
    console.error('Error fetching designations:', error)
    return NextResponse.json(
      {
        success: false,
        data: [],
        error: error.message,
      },
      { status: 500 }
    )
  }
}
