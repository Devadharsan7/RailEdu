import { NextRequest, NextResponse } from 'next/server';
import { classSchedulerService } from '@/lib/classSchedulerService';

export async function GET(request: NextRequest) {
  try {
    await classSchedulerService.connect();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const stationId = searchParams.get('stationId');
    const type = searchParams.get('type');

    switch (type) {
      case 'alerts':
        if (!userId) {
          return NextResponse.json({ error: 'userId required' }, { status: 400 });
        }
        const alerts = await classSchedulerService.getPendingAlerts(userId);
        return NextResponse.json({ alerts });

      case 'status':
        if (!userId) {
          return NextResponse.json({ error: 'userId required' }, { status: 400 });
        }
        const status = await classSchedulerService.getUserStatus(userId);
        return NextResponse.json({ status });

      case 'schedule':
        if (!stationId) {
          return NextResponse.json({ error: 'stationId required' }, { status: 400 });
        }
        const schedule = await classSchedulerService.getStationSchedule(stationId);
        return NextResponse.json({ schedule });

      case 'metrics':
        const metrics = await classSchedulerService.getDashboardMetrics();
        return NextResponse.json({ metrics });

      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await classSchedulerService.connect();
    
    const { action, alertId } = await request.json();

    if (action === 'markSent' && alertId) {
      await classSchedulerService.markAlertAsSent(alertId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

