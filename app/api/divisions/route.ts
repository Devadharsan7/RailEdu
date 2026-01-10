import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { CrewCourse } from '@/lib/models'

// GET all divisions with their stations and users
// Returns structure compatible with frontend expectations
export async function GET() {
  try {
    await connectDB()

    // Get distinct division codes
    const divisionCodes = await CrewCourse.distinct('division.code')
    const sortedDivisionCodes = divisionCodes.sort()

    // For each division, get stations (grouped by crewId which acts as station)
    const divisionsWithData = await Promise.all(
      sortedDivisionCodes.map(async (divisionCode, index) => {
        // Get all crew courses for this division
        const crewCourses = await CrewCourse.find({
          'division.code': divisionCode,
        }).lean()

        // Group by crewId to create stations
        const stationsMap = new Map<string, {
          id: string
          name: string
          code: string
          users: Array<{
            id: string
            name: string
            email: string
            role: string
            status: 'Active' | 'Inactive'
            joinDate: string
            phone?: string
            division: string
            station: string
          }>
        }>()

        crewCourses.forEach((course: any) => {
          const crewId = course.crew.crewId
          const crewName = course.crew.crewName
          const stationCode = `${divisionCode}${crewId}`

          if (!stationsMap.has(stationCode)) {
            stationsMap.set(stationCode, {
              id: stationCode,
              name: `${divisionCode}${crewId} Station`,
              code: stationCode,
              users: [],
            })
          }

          const station = stationsMap.get(stationCode)!
          
          // Check if user already exists (by crewId and crewName)
          const existingUser = station.users.find((u) => u.name === crewName)
          
          if (!existingUser) {
            station.users.push({
              id: `${stationCode}-${crewName}-${Date.now()}`,
              name: crewName,
              email: '',
              role: course.designation?.code || 'Crew',
              status: course.status === 'ACTIVE' || course.status === 'COMPLETED' ? 'Active' : 'Inactive',
              joinDate: course.createdAt
                ? new Date(course.createdAt).toISOString().split('T')[0]
                : new Date().toISOString().split('T')[0],
              division: divisionCode,
              station: station.name,
            })
          }
        })

        return {
          id: `${index + 1}`,
          name: divisionCode,
          code: divisionCode,
          stations: Array.from(stationsMap.values()),
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: divisionsWithData,
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
