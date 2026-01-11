interface User {
  id: string;
  name: string;
  stationId: string;
  email: string;
  assignedClasses: string[];
  completedClasses: string[];
  currentlyInClass: boolean;
}

interface Class {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  dueDate: Date;
  createdBy: string; // admin id
  batchDetails: {
    batchId: string;
    maxParticipants: number;
    currentParticipants: number;
  };
}

interface ClassSession {
  id: string;
  classId: string;
  stationId: string;
  scheduledTime: Date;
  participants: string[];
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
}

interface Alert {
  id: string;
  userId: string;
  classId: string;
  type: 'assignment' | 'reminder' | 'due-soon' | 'overdue';
  message: string;
  scheduledTime: Date;
  sent: boolean;
}

export class ClassSchedulerAlgorithm {
  private users: Map<string, User> = new Map();
  private classes: Map<string, Class> = new Map();
  private sessions: Map<string, ClassSession> = new Map();
  private alerts: Map<string, Alert> = new Map();

  // Assign class to user with automatic scheduling
  assignClassToUser(userId: string, classId: string): boolean {
    const user = this.users.get(userId);
    const classData = this.classes.get(classId);
    
    if (!user || !classData) return false;
    
    // Check if user already has this class
    if (user.assignedClasses.includes(classId)) return false;
    
    // Assign class
    user.assignedClasses.push(classId);
    
    // Schedule optimal time for the class
    const scheduledTime = this.findOptimalScheduleTime(user.stationId, classData);
    
    if (scheduledTime) {
      this.createClassSession(classId, user.stationId, scheduledTime, [userId]);
      this.createAlert(userId, classId, 'assignment', 
        `New class "${classData.title}" assigned. Scheduled for ${scheduledTime.toLocaleString()}`);
    }
    
    return true;
  }

  // Find optimal time considering station conflicts and due dates
  private findOptimalScheduleTime(stationId: string, classData: Class): Date | null {
    const now = new Date();
    const dueDate = classData.dueDate;
    const duration = classData.duration;
    
    // Start checking from next hour
    let checkTime = new Date(now);
    checkTime.setHours(checkTime.getHours() + 1, 0, 0, 0);
    
    while (checkTime < dueDate) {
      // Check if this time slot is available for the station
      if (this.isTimeSlotAvailable(stationId, checkTime, duration)) {
        return checkTime;
      }
      
      // Move to next hour
      checkTime.setHours(checkTime.getHours() + 1);
    }
    
    return null; // No available slot found
  }

  // Check if time slot is available (no conflicts with other classes)
  private isTimeSlotAvailable(stationId: string, startTime: Date, duration: number): boolean {
    const endTime = new Date(startTime.getTime() + duration * 60000);
    
    for (const session of Array.from(this.sessions.values())) {
      if (session.stationId === stationId && session.status !== 'cancelled') {
        const sessionStart = session.scheduledTime;
        const sessionEnd = new Date(sessionStart.getTime() + duration * 60000);
        
        // Check for time overlap
        if (startTime < sessionEnd && endTime > sessionStart) {
          return false;
        }
      }
    }
    
    return true;
  }

  // Create class session
  private createClassSession(classId: string, stationId: string, scheduledTime: Date, participants: string[]): string {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: ClassSession = {
      id: sessionId,
      classId,
      stationId,
      scheduledTime,
      participants,
      status: 'scheduled'
    };
    
    this.sessions.set(sessionId, session);
    return sessionId;
  }

  // Create alert for user
  private createAlert(userId: string, classId: string, type: Alert['type'], message: string): void {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const alert: Alert = {
      id: alertId,
      userId,
      classId,
      type,
      message,
      scheduledTime: new Date(),
      sent: false
    };
    
    this.alerts.set(alertId, alert);
  }

  // Check and send due date reminders
  checkDueDateReminders(): void {
    const now = new Date();
    const reminderThreshold = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    for (const user of Array.from(this.users.values())) {
      for (const classId of user.assignedClasses) {
        if (user.completedClasses.includes(classId)) continue;
        
        const classData = this.classes.get(classId);
        if (!classData) continue;
        
        const timeUntilDue = classData.dueDate.getTime() - now.getTime();
        
        // Send reminder if due within 24 hours
        if (timeUntilDue <= reminderThreshold && timeUntilDue > 0) {
          this.createAlert(user.id, classId, 'due-soon', 
            `Class "${classData.title}" is due in ${Math.ceil(timeUntilDue / (60 * 60 * 1000))} hours!`);
        }
        
        // Send overdue alert
        if (timeUntilDue < 0) {
          this.createAlert(user.id, classId, 'overdue', 
            `Class "${classData.title}" is overdue! Please complete immediately.`);
        }
      }
    }
  }

  // Start class session (user enters class)
  startClassSession(userId: string, sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    const user = this.users.get(userId);
    
    if (!session || !user || !session.participants.includes(userId)) {
      return false;
    }
    
    // Mark user as currently in class
    user.currentlyInClass = true;
    session.status = 'in-progress';
    
    return true;
  }

  // Complete class (user finishes all assigned classes in session)
  completeClassSession(userId: string, sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    const user = this.users.get(userId);
    
    if (!session || !user) return false;
    
    // Mark class as completed
    if (!user.completedClasses.includes(session.classId)) {
      user.completedClasses.push(session.classId);
    }
    
    // Check if user has completed all assigned classes for this session
    const allClassesCompleted = user.assignedClasses.every(classId => 
      user.completedClasses.includes(classId)
    );
    
    if (allClassesCompleted) {
      user.currentlyInClass = false;
      session.status = 'completed';
      
      this.createAlert(userId, session.classId, 'assignment', 
        'All classes completed! You can return to your normal work.');
    }
    
    return true;
  }

  // Get pending alerts for user
  getPendingAlerts(userId: string): Alert[] {
    return Array.from(this.alerts.values())
      .filter(alert => alert.userId === userId && !alert.sent)
      .sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());
  }

  // Mark alert as sent
  markAlertAsSent(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.sent = true;
    }
  }

  // Get user's current status
  getUserStatus(userId: string): {
    currentlyInClass: boolean;
    pendingClasses: number;
    completedClasses: number;
    overdueClasses: number;
  } {
    const user = this.users.get(userId);
    if (!user) {
      return { currentlyInClass: false, pendingClasses: 0, completedClasses: 0, overdueClasses: 0 };
    }
    
    const now = new Date();
    let overdueCount = 0;
    
    for (const classId of user.assignedClasses) {
      if (!user.completedClasses.includes(classId)) {
        const classData = this.classes.get(classId);
        if (classData && classData.dueDate < now) {
          overdueCount++;
        }
      }
    }
    
    return {
      currentlyInClass: user.currentlyInClass,
      pendingClasses: user.assignedClasses.length - user.completedClasses.length,
      completedClasses: user.completedClasses.length,
      overdueClasses: overdueCount
    };
  }

  // Admin functions
  createClass(classData: Omit<Class, 'id'>): string {
    const classId = `class_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.classes.set(classId, { ...classData, id: classId });
    return classId;
  }

  addUser(userData: Omit<User, 'assignedClasses' | 'completedClasses' | 'currentlyInClass'>): string {
    const user: User = {
      ...userData,
      assignedClasses: [],
      completedClasses: [],
      currentlyInClass: false
    };
    this.users.set(userData.id, user);
    return userData.id;
  }

  // Get station schedule
  getStationSchedule(stationId: string): ClassSession[] {
    return Array.from(this.sessions.values())
      .filter(session => session.stationId === stationId)
      .sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());
  }
}