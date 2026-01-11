import { useState, useEffect, useCallback } from 'react';

interface Course {
  _id: string;
  title: string;
  description: string;
  duration: number;
  dueDate: string;
  createdBy: string;
  batchDetails?: {
    batchId: string;
    maxParticipants: number;
    currentParticipants: number;
  };
  status?: 'completed' | 'pending';
  isOverdue?: boolean;
  createdAt: string;
  // Batch assignment fields
  batches?: Array<{
    batchNumber: number;
    classes: Array<{
      classNumber: number;
      memberCount: number;
    }>;
  }>;
  batchesCount?: number;
  classesCount?: number;
  totalMembers?: number;
  stations?: string[];
  excelIds?: string[];
  courseInfo?: {
    timing: string;
    batchMonths: string[];
    batchYear: number;
  };
}

export function useUserCourses(userId: string) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/courses?type=user-courses&userId=${userId}`);
      const data = await response.json();
      
      if (response.ok) {
        setCourses(data.courses);
        setError(null);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  return { courses, loading, error, refetch: fetchCourses };
}

export function useAdminCourses(adminId: string) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = useCallback(async () => {
    if (!adminId) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/courses?type=admin-courses&adminId=${adminId}`);
      const data = await response.json();
      
      if (response.ok && data.success) {
        setCourses(data.courses || []);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch courses');
        setCourses([]);
      }
    } catch (err) {
      console.error('Error fetching admin courses:', err);
      setError('Failed to fetch courses');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [adminId]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  return { courses, loading, error, refetch: fetchCourses };
}

export function useCourseActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeAction = async (action: string, data: any) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/courses', {
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

  const createCourse = (courseData: Omit<Course, '_id' | 'createdAt'>) =>
    executeAction('create', courseData);

  const updateCourse = (courseId: string, updateData: Partial<Course>) =>
    executeAction('update', { courseId, ...updateData });

  const deleteCourse = (courseId: string) =>
    executeAction('delete', { courseId });

  return {
    loading,
    error,
    createCourse,
    updateCourse,
    deleteCourse
  };
}