import { MongoClient } from 'mongodb';

class AutoScheduler {
  private client: MongoClient;
  private db: any;
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    this.client = new MongoClient(process.env.MONGODB_URI!);
  }

  async start() {
    await this.client.connect();
    this.db = this.client.db('railedu');
    
    console.log('Auto-scheduler started');
    
    // Run every 10 minutes
    this.intervalId = setInterval(() => {
      this.runSchedulingTasks();
    }, 10 * 60 * 1000);

    // Run immediately
    this.runSchedulingTasks();
  }

  async stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    await this.client.close();
    console.log('Auto-scheduler stopped');
  }

  private async runSchedulingTasks() {
    try {
      await this.checkDueDateAlerts();
      await this.processAutoAssignments();
      await this.handleOverdueClasses();
    } catch (error) {
      console.error('Scheduling task error:', error);
    }
  }

  private async checkDueDateAlerts() {
    const now = new Date();
    const reminderTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours ahead

    // Find classes due within 24 hours
    const upcomingClasses = await this.db.collection('sessions').find({
      status: 'scheduled',
      scheduledTime: { $gte: now, $lte: reminderTime }
    }).toArray();

    for (const session of upcomingClasses) {
      await this.createReminderAlert(session);
    }
  }

  private async createReminderAlert(session: any) {
    const user = await this.db.collection('users').findOne({ _id: session.userId });
    const classData = await this.db.collection('classes').findOne({ _id: session.classId });

    if (!user || !classData) return;

    // Check if reminder already sent
    const existingAlert = await this.db.collection('alerts').findOne({
      userId: session.userId,
      classId: session.classId,
      type: 'reminder'
    });

    if (existingAlert) return;

    // Create reminder alert
    await this.db.collection('alerts').insertOne({
      _id: `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: session.userId,
      classId: session.classId,
      type: 'reminder',
      message: `Reminder: Class "${classData.title}" is scheduled for ${session.scheduledTime.toLocaleString()}`,
      scheduledTime: new Date(),
      sent: false
    });

    console.log(`Reminder created for user ${user.name} - class ${classData.title}`);
  }

  private async processAutoAssignments() {
    // Find classes that need auto-assignment
    const pendingClasses = await this.db.collection('classes').find({
      autoAssign: true,
      assignmentProcessed: { $ne: true }
    }).toArray();

    for (const classData of pendingClasses) {
      if (classData.targetStations && classData.targetStations.length > 0) {
        for (const stationId of classData.targetStations) {
          await this.assignClassToStation(classData._id, stationId);
        }

        // Mark as processed
        await this.db.collection('classes').updateOne(
          { _id: classData._id },
          { $set: { assignmentProcessed: true } }
        );

        console.log(`Auto-assigned class ${classData.title} to stations`);
      }
    }
  }

  private async assignClassToStation(classId: string, stationId: string) {
    const users = await this.db.collection('users').find({ stationId }).toArray();

    for (const user of users) {
      try {
        await this.scheduleClassForUser(user._id, classId);
      } catch (error) {
        console.error(`Failed to schedule class for user ${user._id}:`, error);
      }
    }
  }

  private async scheduleClassForUser(userId: string, classId: string) {
    const user = await this.db.collection('users').findOne({ _id: userId });
    const classData = await this.db.collection('classes').findOne({ _id: classId });

    if (!user || !classData) return;

    // Check if already assigned
    const existingSession = await this.db.collection('sessions').findOne({
      userId,
      classId,
      status: { $in: ['scheduled', 'in-progress'] }
    });

    if (existingSession) return;

    const scheduledTime = await this.findOptimalTimeSlot(user.stationId, classData);

    if (!scheduledTime) {
      console.warn(`No available time slot for user ${user.name} - class ${classData.title}`);
      return;
    }

    // Create session
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await this.db.collection('sessions').insertOne({
      _id: sessionId,
      classId,
      userId,
      stationId: user.stationId,
      scheduledTime,
      status: 'scheduled',
      createdAt: new Date()
    });

    // Update user
    await this.db.collection('users').updateOne(
      { _id: userId },
      { $addToSet: { assignedClasses: classId } }
    );

    // Create alerts
    await this.createSchedulingAlerts(userId, classId, scheduledTime, user.stationId);
  }

  private async findOptimalTimeSlot(stationId: string, classData: any) {
    const now = new Date();
    const dueDate = new Date(classData.dueDate);
    const duration = classData.duration * 60000;

    let checkTime = new Date(now);
    checkTime.setHours(checkTime.getHours() + 1, 0, 0, 0);

    while (checkTime < dueDate) {
      const conflicts = await this.db.collection('sessions').find({
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

  private async createSchedulingAlerts(userId: string, classId: string, scheduledTime: Date, stationId: string) {
    const classData = await this.db.collection('classes').findOne({ _id: classId });
    const user = await this.db.collection('users').findOne({ _id: userId });

    // User alert
    await this.db.collection('alerts').insertOne({
      _id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      classId,
      type: 'assignment',
      message: `New class "${classData.title}" scheduled for ${scheduledTime.toLocaleString()}`,
      scheduledTime: new Date(),
      sent: false
    });

    // Admin alert
    await this.db.collection('alerts').insertOne({
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

  private async handleOverdueClasses() {
    const now = new Date();

    // Find overdue sessions
    const overdueSessions = await this.db.collection('sessions').find({
      status: 'scheduled',
      scheduledTime: { $lt: now }
    }).toArray();

    for (const session of overdueSessions) {
      // Create overdue alert
      const user = await this.db.collection('users').findOne({ _id: session.userId });
      const classData = await this.db.collection('classes').findOne({ _id: session.classId });

      if (user && classData) {
        await this.db.collection('alerts').insertOne({
          _id: `overdue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: session.userId,
          classId: session.classId,
          type: 'overdue',
          message: `Class "${classData.title}" is overdue! Please complete immediately.`,
          scheduledTime: new Date(),
          sent: false
        });

        console.log(`Overdue alert created for user ${user.name} - class ${classData.title}`);
      }
    }
  }
}

export const autoScheduler = new AutoScheduler();

// Auto-start in production
if (process.env.NODE_ENV === 'production') {
  autoScheduler.start().catch(console.error);
}