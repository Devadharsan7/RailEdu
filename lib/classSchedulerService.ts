import { MongoClient, Db, Collection } from 'mongodb';
import { ClassSchedulerAlgorithm } from './classScheduler';

interface DatabaseCollections {
  users: Collection;
  classes: Collection;
  sessions: Collection;
  alerts: Collection;
}

export class ClassSchedulerService {
  private db: Db | null = null;
  private collections: DatabaseCollections | null = null;
  private scheduler: ClassSchedulerAlgorithm;
  private client: MongoClient | null = null;

  constructor() {
    this.scheduler = new ClassSchedulerAlgorithm();
  }

  async connect(): Promise<void> {
    try {
      this.client = new MongoClient(process.env.MONGODB_URI!);
      await this.client.connect();
      this.db = this.client.db('railedu');
      
      this.collections = {
        users: this.db.collection('users'),
        classes: this.db.collection('classes'),
        sessions: this.db.collection('sessions'),
        alerts: this.db.collection('alerts')
      };

      // Load existing data into scheduler
      await this.loadDataIntoScheduler();
      
      console.log('Connected to MongoDB and loaded data into scheduler');
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  private async loadDataIntoScheduler(): Promise<void> {
    if (!this.collections) return;

    // Load users
    const users = await this.collections.users.find({}).toArray();
    users.forEach(user => {
      this.scheduler.addUser({
        id: user._id.toString(),
        name: user.name,
        stationId: user.stationId,
        email: user.email
      });
    });

    // Load classes
    const classes = await this.collections.classes.find({}).toArray();
    classes.forEach(classData => {
      this.scheduler.createClass({
        title: classData.title,
        description: classData.description,
        duration: classData.duration,
        dueDate: new Date(classData.dueDate),
        createdBy: classData.createdBy,
        batchDetails: classData.batchDetails
      });
    });
  }

  // User Management
  async createUser(userData: {
    name: string;
    stationId: string;
    email: string;
  }): Promise<string> {
    if (!this.collections) throw new Error('Database not connected');

    const result = await this.collections.users.insertOne({
      ...userData,
      assignedClasses: [],
      completedClasses: [],
      currentlyInClass: false,
      createdAt: new Date()
    });

    const userId = result.insertedId.toString();
    this.scheduler.addUser({ ...userData, id: userId });
    
    return userId;
  }

  async getUsersByStation(stationId: string): Promise<any[]> {
    if (!this.collections) throw new Error('Database not connected');
    
    return await this.collections.users.find({ stationId }).toArray();
  }

  // Class Management
  async createClass(classData: {
    title: string;
    description: string;
    duration: number;
    dueDate: Date;
    createdBy: string;
    batchDetails: {
      batchId: string;
      maxParticipants: number;
    };
  }): Promise<string> {
    if (!this.collections) throw new Error('Database not connected');

    const result = await this.collections.classes.insertOne({
      ...classData,
      batchDetails: {
        ...classData.batchDetails,
        currentParticipants: 0
      },
      createdAt: new Date()
    });

    const classId = result.insertedId.toString();
    this.scheduler.createClass({
      ...classData,
      batchDetails: {
        ...classData.batchDetails,
        currentParticipants: 0
      }
    });

    return classId;
  }

  // Assignment and Scheduling
  async assignClassToUser(userId: string, classId: string): Promise<boolean> {
    if (!this.collections) throw new Error('Database not connected');

    const success = this.scheduler.assignClassToUser(userId, classId);
    
    if (success) {
      // Update database
      await this.collections.users.updateOne(
        { userId: userId },
        { $addToSet: { assignedClasses: classId } }
      );

      // Update batch participant count
      await this.collections.classes.updateOne(
        { classId: classId },
        { $inc: { 'batchDetails.currentParticipants': 1 } }
      );
    }

    return success;
  }

  async assignClassToBatch(classId: string, stationIds: string[]): Promise<void> {
    if (!this.collections) throw new Error('Database not connected');

    for (const stationId of stationIds) {
      const users = await this.getUsersByStation(stationId);
      
      for (const user of users) {
        await this.assignClassToUser(user._id.toString(), classId);
      }
    }
  }

  // Session Management
  async startClassSession(userId: string, sessionId: string): Promise<boolean> {
    if (!this.collections) throw new Error('Database not connected');

    const success = this.scheduler.startClassSession(userId, sessionId);
    
    if (success) {
      await this.collections.users.updateOne(
        { _id: userId } as any,
        { $set: { currentlyInClass: true } }
      );

      await this.collections.sessions.updateOne(
        { _id: sessionId } as any,
        { $set: { status: 'in-progress', startedAt: new Date() } }
      );
    }

    return success;
  }

  async completeClassSession(userId: string, sessionId: string): Promise<boolean> {
    if (!this.collections) throw new Error('Database not connected');

    const success = this.scheduler.completeClassSession(userId, sessionId);
    
    if (success) {
      const session = await this.collections.sessions.findOne({ _id: sessionId } as any);
      
      if (session) {
        await this.collections.users.updateOne(
          { _id: userId } as any,
          { 
            $addToSet: { completedClasses: session.classId },
            $set: { currentlyInClass: false }
          }
        );
      }

      await this.collections.sessions.updateOne(
        { _id: sessionId } as any,
        { $set: { status: 'completed', completedAt: new Date() } }
      );
    }

    return success;
  }

  // Alert Management
  async getPendingAlerts(userId: string): Promise<any[]> {
    const alerts = this.scheduler.getPendingAlerts(userId);
    
    // Save new alerts to database
    for (const alert of alerts) {
      await this.collections?.alerts.updateOne(
        { _id: alert.id } as any,
        { $set: alert },
        { upsert: true }
      );
    }

    return alerts;
  }

  async getPendingAdminAlerts(adminId: string): Promise<any[]> {
    const alerts = this.scheduler.getPendingAlerts(adminId);
    
    // Save new alerts to database
    for (const alert of alerts) {
      await this.collections?.alerts.updateOne(
        { _id: alert.id } as any,
        { $set: alert },
        { upsert: true }
      );
    }

    return alerts;
  }

  async markAlertAsSent(alertId: string): Promise<void> {
    if (!this.collections) throw new Error('Database not connected');

    this.scheduler.markAlertAsSent(alertId);
    
    await this.collections.alerts.updateOne(
      { _id: alertId } as any,
      { $set: { sent: true, sentAt: new Date() } }
    );
  }

  // Monitoring and Reports
  async getUserStatus(userId: string): Promise<any> {
    return this.scheduler.getUserStatus(userId);
  }

  async getStationSchedule(stationId: string): Promise<any[]> {
    return this.scheduler.getStationSchedule(stationId);
  }

  async getDashboardMetrics(): Promise<{
    totalUsers: number;
    totalClasses: number;
    activeClasses: number;
    completedClasses: number;
    overdueClasses: number;
  }> {
    if (!this.collections) throw new Error('Database not connected');

    const totalUsers = await this.collections.users.countDocuments();
    const totalClasses = await this.collections.classes.countDocuments();
    const activeClasses = await this.collections.sessions.countDocuments({ 
      status: { $in: ['scheduled', 'in-progress'] } 
    });
    const completedClasses = await this.collections.sessions.countDocuments({ 
      status: 'completed' 
    });
    
    // Count overdue classes
    const now = new Date();
    const completedClassIds = await this.getCompletedClassIds();
    const overdueClasses = await this.collections.classes.countDocuments({
      dueDate: { $lt: now },
      _id: { $nin: completedClassIds } as any
    });

    return {
      totalUsers,
      totalClasses,
      activeClasses,
      completedClasses,
      overdueClasses
    };
  }

  private async getCompletedClassIds(): Promise<string[]> {
    if (!this.collections) return [];
    
    const completedSessions = await this.collections.sessions.find(
      { status: 'completed' },
      { projection: { classId: 1 } }
    ).toArray();
    
    return completedSessions.map(session => session.classId);
  }

  // Background Tasks
  async runScheduledTasks(): Promise<void> {
    // Check for due date reminders
    this.scheduler.checkDueDateReminders();
    
    // Auto-assign classes based on batch rules
    await this.processAutomaticAssignments();
  }

  private async processAutomaticAssignments(): Promise<void> {
    if (!this.collections) return;

    // Find classes that need automatic assignment
    const pendingClasses = await this.collections.classes.find({
      autoAssign: true,
      assignmentProcessed: { $ne: true }
    }).toArray();

    for (const classData of pendingClasses) {
      const targetStations = classData.targetStations || [];
      
      if (targetStations.length > 0) {
        await this.assignClassToBatch(classData._id.toString(), targetStations);
        
        // Mark as processed
        await this.collections.classes.updateOne(
          { _id: classData._id } as any,
          { $set: { assignmentProcessed: true } }
        );
      }
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      console.log('Disconnected from MongoDB');
    }
  }
}

// Singleton instance
export const classSchedulerService = new ClassSchedulerService();