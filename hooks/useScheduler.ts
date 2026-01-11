import { useState, useEffect, useCallback } from 'react';

interface Alert {
  id: string;
  userId: string;
  classId: string;
  type: 'assignment' | 'reminder' | 'due-soon' | 'overdue';
  message: string;
  scheduledTime: Date;
  sent: boolean;
}

interface UserStatus {
  currentlyInClass: boolean;
  pendingClasses: number;
  completedClasses: number;
  overdueClasses: number;
}

interface ClassSession {
  id: string;
  classId: string;
  stationId: string;
  scheduledTime: Date;
  participants: string[];
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
}

// Hook for managing user alerts
export function useUserAlerts(userId: string) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/alerts?type=alerts&userId=${userId}`);
      const data = await response.json();
      
      if (response.ok) {
        setAlerts(data.alerts);
        setError(null);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const markAlertAsSent = async (alertId: string) => {
    try {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markSent', alertId })
      });

      if (response.ok) {
        setAlerts(prev => prev.filter(alert => alert.id !== alertId));
      }
    } catch (err) {
      console.error('Failed to mark alert as sent:', err);
    }
  };

  useEffect(() => {
    fetchAlerts();
    
    // Poll for new alerts every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  return { alerts, loading, error, refetch: fetchAlerts, markAsSent: markAlertAsSent };
}

// Hook for managing admin alerts (gets all alerts for administrators)
export function useAdminAlerts(adminId: string) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    if (!adminId) {
      setAlerts([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      // For admins, fetch all alerts (or you can modify to fetch specific alerts)
      const response = await fetch(`/api/alerts?type=alerts&userId=${adminId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Handle both possible response formats
      if (data.alerts && Array.isArray(data.alerts)) {
        setAlerts(data.alerts);
      } else if (Array.isArray(data)) {
        setAlerts(data);
      } else {
        setAlerts([]);
      }
    } catch (err) {
      console.error('Error fetching admin alerts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, [adminId]);

  const markAlertAsSent = async (alertId: string) => {
    try {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markSent', alertId })
      });

      if (response.ok) {
        setAlerts(prev => prev.filter(alert => alert.id !== alertId));
      }
    } catch (err) {
      console.error('Failed to mark alert as sent:', err);
    }
  };

  useEffect(() => {
    fetchAlerts();
    
    // Poll for new alerts every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  return { alerts: alerts || [], loading, error, refetch: fetchAlerts, markAsSent: markAlertAsSent };
}

// Hook for user status
export function useUserStatus(userId: string) {
  const [status, setStatus] = useState<UserStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/alerts?type=status&userId=${userId}`);
      const data = await response.json();
      
      if (response.ok) {
        setStatus(data.status);
        setError(null);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch status');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchStatus();
    
    // Poll for status updates every 60 seconds
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  return { status, loading, error, refetch: fetchStatus };
}

// Hook for station schedule
export function useStationSchedule(stationId: string) {
  const [schedule, setSchedule] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedule = useCallback(async () => {
    if (!stationId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/alerts?type=schedule&stationId=${stationId}`);
      const data = await response.json();
      
      if (response.ok) {
        setSchedule(data.schedule);
        setError(null);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch schedule');
    } finally {
      setLoading(false);
    }
  }, [stationId]);

  useEffect(() => {
    fetchSchedule();
    
    // Poll for schedule updates every 2 minutes
    const interval = setInterval(fetchSchedule, 120000);
    return () => clearInterval(interval);
  }, [fetchSchedule]);

  return { schedule, loading, error, refetch: fetchSchedule };
}

// Hook for scheduler actions
export function useSchedulerActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeAction = async (action: string, data: any) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...data })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Action failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createUser = (userData: { name: string; stationId: string; email: string }) =>
    executeAction('createUser', userData);

  const createClass = (classData: any) =>
    executeAction('createClass', classData);

  const assignClass = (userId: string, classId: string) =>
    executeAction('assignClass', { userId, classId });

  const assignBatch = (classId: string, stationIds: string[]) =>
    executeAction('assignBatch', { classId, stationIds });

  const startSession = (userId: string, sessionId: string) =>
    executeAction('startSession', { userId, sessionId });

  const completeSession = (userId: string, sessionId: string) =>
    executeAction('completeSession', { userId, sessionId });

  return {
    loading,
    error,
    createUser,
    createClass,
    assignClass,
    assignBatch,
    startSession,
    completeSession
  };
}