import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

// Mark route as dynamic
export const dynamic = 'force-dynamic'

const client = new MongoClient(process.env.MONGODB_URI!);

export async function POST(request: NextRequest) {
  try {
    await client.connect();
    const db = client.db('railedu');
    
    const { action, ...data } = await request.json();

    switch (action) {
      case 'scheduleClass':
        const result = await scheduleClassForUser(db, data.userId, data.classId);
        return NextResponse.json({ success: true, scheduledTime: result });

      case 'assignBatchToStation':
        await assignBatchToStation(db, data.classId, data.stationId);
        return NextResponse.json({ success: true });

      case 'getUserSchedule':
        const schedule = await getUserSchedule(db, data.userId);
        return NextResponse.json({ schedule });

      case 'getStationConflicts':
        const conflicts = await getStationConflicts(db, data.stationId);
        return NextResponse.json({ conflicts });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Scheduling Error:', error);
    return NextResponse.json({ error: 'Scheduling failed' }, { status: 500 });
  }
}

async function scheduleClassForUser(db: any, userId: string, classId: string) {
  const user = await db.collection('users').findOne({ _id: userId });
  const classData = await db.collection('classes').findOne({ _id: classId });
  
  if (!user || !classData) throw new Error('User or class not found');

  const scheduledTime = await findOptimalTimeSlot(db, user.stationId, classData);
  
  if (!scheduledTime) throw new Error('No available time slot');

  const sessionId = `session_${Date.now()}`;
  await db.collection('sessions').insertOne({
    _id: sessionId,
    classId,
    userId,
    stationId: user.stationId,
    scheduledTime,
    status: 'scheduled',
    createdAt: new Date()
  });

  await db.collection('users').updateOne(
    { _id: userId },
    { $addToSet: { assignedClasses: classId } }
  );

  await createAlerts(db, userId, classId, scheduledTime, user.stationId);

  return scheduledTime;
}

async function findOptimalTimeSlot(db: any, stationId: string, classData: any) {
  const now = new Date();
  const dueDate = new Date(classData.dueDate);
  const duration = classData.duration * 60000;
  
  let checkTime = new Date(now);
  checkTime.setHours(checkTime.getHours() + 1, 0, 0, 0);
  
  while (checkTime < dueDate) {
    const conflicts = await db.collection('sessions').find({
      stationId,
      status: { $in: ['scheduled', 'in-progress'] },
      scheduledTime: {
        $gte: checkTime,
        $lt: new Date(checkTime.getTime() + duration)
      }
    }).toArray();

    if (conflicts.length === 0) {
      return checkTime;
    }
    
    checkTime.setHours(checkTime.getHours() + 1);
  }
  
  return null;
}

async function assignBatchToStation(db: any, classId: string, stationId: string) {
  const users = await db.collection('users').find({ stationId }).toArray();
  
  for (const user of users) {
    try {
      await scheduleClassForUser(db, user._id, classId);
    } catch (error) {
      console.error(`Failed to schedule for user ${user._id}:`, error);
    }
  }
}

async function createAlerts(db: any, userId: string, classId: string, scheduledTime: Date, stationId: string) {
  const classData = await db.collection('classes').findOne({ _id: classId });
  const user = await db.collection('users').findOne({ _id: userId });
  
  await db.collection('alerts').insertOne({
    _id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    classId,
    type: 'assignment',
    message: `New class "${classData.title}" scheduled for ${scheduledTime.toLocaleString()}`,
    scheduledTime: new Date(),
    sent: false
  });

  await db.collection('alerts').insertOne({
    _id: `admin_alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId: classData.createdBy,
    classId,
    type: 'assignment',
    message: `User ${user.name} (Station: ${stationId}) assigned to class "${classData.title}"`,
    scheduledTime: new Date(),
    sent: false,
    adminAlert: true
  });
}

async function getUserSchedule(db: any, userId: string) {
  return await db.collection('sessions').find({
    userId,
    status: { $in: ['scheduled', 'in-progress'] }
  }).sort({ scheduledTime: 1 }).toArray();
}

async function getStationConflicts(db: any, stationId: string) {
  const now = new Date();
  return await db.collection('sessions').find({
    stationId,
    status: { $in: ['scheduled', 'in-progress'] },
    scheduledTime: { $gte: now }
  }).sort({ scheduledTime: 1 }).toArray();
}