import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { CrewCourse } from '@/lib/models'

// Mark route as dynamic
export const dynamic = 'force-dynamic'

// GET crews/users for a division + designation combination - returns array of users
// Example: /api/divisions/TBM/designations/MMAN/crews
// Returns: [{ crewId: "1844", crewName: "DEVAKUMAR.M" }, ...]
export async function GET(
  request: NextRequest,
  { params }: { params: { divisionCode: string; designationCode: string } }
) {
  try {
    await connectDB()

    const divisionCode = params.divisionCode.toUpperCase()
    const designationCode = params.designationCode.toUpperCase()

    // Get all crew courses matching division + designation
    const crewCourses = await CrewCourse.find({
      'division.code': divisionCode,
      'designation.code': designationCode,
    })
      .select('crew.crewId crew.crewName')
      .lean()

    // Get unique crews (by crewId) - return as array
    const uniqueCrewsMap = new Map<string, { crewId: string; crewName: string }>()

    crewCourses.forEach((course: any) => {
      const crewId = course.crew.crewId
      if (!uniqueCrewsMap.has(crewId)) {
        uniqueCrewsMap.set(crewId, {
          crewId: course.crew.crewId,
          crewName: course.crew.crewName,
        })
      }
    })

    // Convert to array and sort by crewId
    const crews = Array.from(uniqueCrewsMap.values()).sort((a, b) => 
      a.crewId.localeCompare(b.crewId)
    )

    return NextResponse.json({
      success: true,
      data: crews, // Returns: [{ crewId: "1844", crewName: "DEVAKUMAR.M" }, ...]
      count: crews.length,
    })
  } catch (error: any) {
    console.error('Error fetching crews:', error)
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
