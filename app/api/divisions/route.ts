import { NextResponse } from 'next/server'
import { dbDivisions, dbStations, dbUsers } from '@/lib/db'

export async function GET() {
  try {
    let divisions
    try {
      divisions = await dbDivisions.getAll()
    } catch (dbError: any) {
      console.error('Database error (returning empty):', dbError.message)
      divisions = []
    }
    
    // If no divisions from database, return empty array (will fallback to localStorage)
    if (!divisions || divisions.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      })
    }
    
    // For each division, get its stations and users
    const divisionsWithData = await Promise.all(
      divisions.map(async (division) => {
        let stations = []
        try {
          stations = await dbStations.getByDivision(division.id) || []
        } catch (error: any) {
          console.error(`Error getting stations for division ${division.id}:`, error.message)
          stations = []
        }
        
        const stationsWithUsers = await Promise.all(
          stations.map(async (station) => {
            let users = []
            try {
              users = await dbUsers.getByStation(station.id) || []
            } catch (error: any) {
              console.error(`Error getting users for station ${station.id}:`, error.message)
              users = []
            }
            
            return {
              id: station.id,
              name: station.name,
              code: station.code,
              users: users.map((u: any) => ({
                id: u.id,
                name: u.name,
                email: u.email || '',
                role: u.role || 'Crew',
                status: (u.status || 'Active') as 'Active' | 'Inactive',
                joinDate: u.join_date || new Date().toISOString().split('T')[0],
                phone: u.phone || undefined,
                division: division.name,
                station: station.name,
              })),
            }
          })
        )

        return {
          id: division.id,
          name: division.name,
          code: division.code,
          stations: stationsWithUsers,
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: divisionsWithData,
    })
  } catch (error: any) {
    console.error('Error fetching divisions:', error)
    // Return empty array instead of error so it can fallback to localStorage
    return NextResponse.json({
      success: true,
      data: [],
    })
  }
}

