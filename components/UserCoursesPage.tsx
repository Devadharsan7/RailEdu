import { useUserCourses } from '@/hooks/useCourses';
import { Clock, Calendar, CheckCircle, AlertTriangle, BookOpen } from 'lucide-react';
import { useState } from 'react';

interface UserCoursesPageProps {
  userId: string;
}

export default function UserCoursesPage({ userId }: UserCoursesPageProps) {
  const { courses, loading, error, refetch } = useUserCourses(userId);
  const [startingCourse, setStartingCourse] = useState<string | null>(null);

  const startCourse = async (courseId: string) => {
    setStartingCourse(courseId);
    try {
      const response = await fetch('/api/schedule-algorithm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'startSession', userId, courseId })
      });
      
      if (response.ok) {
        refetch();
        alert('Course started successfully!');
      } else {
        alert('Failed to start course');
      }
    } catch (error) {
      alert('Error starting course');
    } finally {
      setStartingCourse(null);
    }
  };

  const completeCourse = async (courseId: string) => {
    try {
      const response = await fetch('/api/schedule-algorithm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'completeSession', userId, courseId })
      });
      
      if (response.ok) {
        refetch();
        alert('Course completed successfully!');
      } else {
        alert('Failed to complete course');
      }
    } catch (error) {
      alert('Error completing course');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">My Courses</h1>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">My Courses</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Error: {error}</p>
        </div>
      </div>
    );
  }

  const pendingCourses = courses.filter(c => c.status === 'pending');
  const completedCourses = courses.filter(c => c.status === 'completed');
  const overdueCourses = courses.filter(c => c.isOverdue);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Courses</h1>
        <div className="flex gap-4 text-sm">
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            Pending ({pendingCourses.length})
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            Completed ({completedCourses.length})
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            Overdue ({overdueCourses.length})
          </span>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No courses assigned</h3>
          <p className="text-gray-500">You don't have any courses assigned yet.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {courses.map((course) => (
            <div
              key={course._id}
              className={`bg-white rounded-lg shadow p-6 border-l-4 ${
                course.status === 'completed' 
                  ? 'border-l-green-500' 
                  : course.isOverdue 
                  ? 'border-l-red-500' 
                  : 'border-l-blue-500'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{course.title}</h3>
                    {course.status === 'completed' && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    {course.isOverdue && (
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  
                  <p className="text-gray-600 mb-4">{course.description}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {course.duration} minutes
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Due: {new Date(course.dueDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                <div className="ml-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    course.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : course.isOverdue
                      ? 'bg-red-100 text-red-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {course.status === 'completed' 
                      ? 'Completed' 
                      : course.isOverdue 
                      ? 'Overdue' 
                      : 'Pending'}
                  </span>
                </div>
              </div>
              
              {course.status === 'pending' && (
                <div className="mt-4 pt-4 border-t">
                  <button 
                    onClick={() => startCourse(course._id)}
                    disabled={startingCourse === course._id}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
                  >
                    {startingCourse === course._id ? 'Starting...' : 'Start Course'}
                  </button>
                </div>
              )}
              
              {course.status === 'in-progress' && (
                <div className="mt-4 pt-4 border-t">
                  <button 
                    onClick={() => completeCourse(course._id)}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                  >
                    Complete Course
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}