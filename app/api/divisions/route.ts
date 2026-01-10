import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { CrewCourse } from '@/lib/models'

// GET all divisions - returns array of division codes
// Example: ["TBM", "MAS", "MS", "AJJ", "KPD"]
export async function GET() {
  try {
    await connectDB()

    // Get distinct division codes as a simple array
    const divisions = await CrewCourse.distinct('division.code')

    // Sort alphabetically
    const sortedDivisions = divisions.sort()

    return NextResponse.json({
      success: true,
      data: sortedDivisions, // Returns: ["AJJ", "KPD", "MAS", "MS", "TBM"]
    })
  } catch (error: any) {
    console.error('Error fetching divisions:', error)
    return NextResponse.json({
      success: false,
      data: [],
      error: error.message,
    })
  }
}
