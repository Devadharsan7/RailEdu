import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { checkDueDatesAndSendAlerts } from '@/lib/batchAssignment'

// Mark route as dynamic
export const dynamic = 'force-dynamic'

/**
 * Scheduler endpoint to check due dates and send alerts
 * This can be called by:
 * 1. A cron job service (e.g., Vercel Cron, GitHub Actions, etc.)
 * 2. A scheduled task in your hosting platform
 * 3. An external monitoring service
 * 
 * Recommended: Call this endpoint daily (e.g., every morning at 9 AM)
 */
export async function GET(request: NextRequest) {
  try {
    // Optional: Add authentication/authorization check here
    // For example, check for an API key or secret token
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.SCHEDULER_SECRET_TOKEN

    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    const result = await checkDueDatesAndSendAlerts()

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to check due dates and send alerts',
          details: result.errors,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed alerts. Sent ${result.alertsSent} alerts.`,
      data: result,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Error in scheduler:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process scheduler task',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

// Also support POST for cron services that prefer POST
export async function POST(request: NextRequest) {
  return GET(request)
}




