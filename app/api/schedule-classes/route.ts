import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { scheduleClassesForUsers } from '@/lib/classScheduling'
import { ClassSchedule } from '@/lib/models'

// Mark route as dynamic
export const dynamic = 'force-dynamic'

// POST: Schedule classes for all users
export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()
    const {
      classDurationMinutes,
      breakBetweenClasses,
      bufferDaysBeforeDue,
      workingHours,
      daysOfWeek,
    } = body

    const config: any = {}
    if (classDurationMinutes) config.classDurationMinutes = classDurationMinutes
    if (breakBetweenClasses) config.breakBetweenClasses = breakBetweenClasses
    if (bufferDaysBeforeDue) config.bufferDaysBeforeDue = bufferDaysBeforeDue
    if (workingHours) config.workingHours = workingHours
    if (daysOfWeek) config.daysOfWeek = daysOfWeek

    const result = await scheduleClassesForUsers(config)

    return NextResponse.json({
      success: result.success,
      message: `Scheduled ${result.scheduled} users, ${result.failed} failed`,
      data: result,
    })
  } catch (error: any) {
    console.error('Error scheduling classes:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to schedule classes',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

// GET: Get schedules for users or stations
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const crewId = searchParams.get('crewId')
    const stationCode = searchParams.get('stationCode')
    const divisionCode = searchParams.get('divisionCode')
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let query: any = {}

    if (crewId) {
      query.crewId = crewId
    }

    if (stationCode) {
      query.stationCode = stationCode
    }

    if (divisionCode) {
      query.divisionCode = divisionCode
    }

    if (status) {
      query.status = status
    }

    if (startDate || endDate) {
      query.startTime = {}
      if (startDate) {
        query.startTime.$gte = new Date(startDate)
      }
      if (endDate) {
        query.startTime.$lte = new Date(endDate)
      }
    }

    const schedules = await ClassSchedule.find(query)
      .sort({ startTime: 1 })
      .lean()

    return NextResponse.json({
      success: true,
      data: schedules,
      count: schedules.length,
    })
  } catch (error: any) {
    console.error('Error fetching schedules:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch schedules',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

// PATCH: Update schedule status
export async function PATCH(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()
    const { scheduleId, status } = body

    if (!scheduleId || !status) {
      return NextResponse.json(
        { error: 'scheduleId and status are required' },
        { status: 400 }
      )
    }

    const validStatuses = ['scheduled', 'in-progress', 'completed', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    const schedule = await ClassSchedule.findOneAndUpdate(
      { scheduleId },
      {
        status,
        updatedAt: new Date(),
      },
      { new: true }
    )

    if (!schedule) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: schedule,
    })
  } catch (error: any) {
    console.error('Error updating schedule:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update schedule',
        details: error.message,
      },
      { status: 500 }
    )
  }
}



