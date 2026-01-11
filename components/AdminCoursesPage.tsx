import { useState, useEffect } from 'react';
import { useAdminCourses, useCourseActions } from '@/hooks/useCourses';
import { Edit, Trash2, Calendar, Clock, Users, Layers, Eye, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';

interface AdminCoursesPageProps {
  adminId: string;
}

export default function AdminCoursesPage({ adminId }: AdminCoursesPageProps) {
  const { courses, loading, refetch, error } = useAdminCourses(adminId);
  const { createCourse, updateCourse, deleteCourse, loading: actionLoading } = useCourseActions();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-refresh every 30 seconds to catch new batch assignments
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [refetch]);

  // Refresh when page becomes visible (user switches back to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refetch();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refetch]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 60,
    dueDate: '',
    batchDetails: {
      batchId: '',
      maxParticipants: 50
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCourse) {
        await updateCourse(editingCourse._id, formData);
        setEditingCourse(null);
      } else {
        await createCourse({
          ...formData,
          createdBy: adminId,
          batchDetails: {
            ...formData.batchDetails,
            currentParticipants: 0
          }
        });
        setShowCreateForm(false);
      }
      
      setFormData({
        title: '',
        description: '',
        duration: 60,
        dueDate: '',
        batchDetails: {
          batchId: '',
          maxParticipants: 50
        }
      });
      
      refetch();
    } catch (error) {
      console.error('Failed to save course:', error);
    }
  };

  const handleEdit = (course: any) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      description: course.description,
      duration: course.duration,
      dueDate: course.dueDate.split('T')[0],
      batchDetails: course.batchDetails
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (courseId: string) => {
    if (confirm('Are you sure you want to delete this course?')) {
      try {
        await deleteCourse(courseId);
        refetch();
      } catch (error) {
        console.error('Failed to delete course:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Course Management</h1>
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

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Course Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            View courses with batch assignments. Batches are created when you assign members to courses.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing || loading}
          className="bg-gray-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Refresh courses"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingCourse ? 'Edit Course' : 'Create New Course'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Course Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full border rounded-lg px-3 py-2 h-24"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Due Date</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Batch ID</label>
                <input
                  type="text"
                  value={formData.batchDetails.batchId}
                  onChange={(e) => setFormData({
                    ...formData, 
                    batchDetails: {...formData.batchDetails, batchId: e.target.value}
                  })}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Max Participants</label>
                <input
                  type="number"
                  value={formData.batchDetails.maxParticipants}
                  onChange={(e) => setFormData({
                    ...formData, 
                    batchDetails: {...formData.batchDetails, maxParticipants: parseInt(e.target.value)}
                  })}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={actionLoading}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {actionLoading ? 'Saving...' : editingCourse ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingCourse(null);
                  setFormData({
                    title: '',
                    description: '',
                    duration: 60,
                    dueDate: '',
                    batchDetails: { batchId: '', maxParticipants: 50 }
                  });
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Success message */}
      {courses.length > 0 && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 text-green-800 text-sm">
          Found <strong>{courses.length}</strong> course{courses.length !== 1 ? 's' : ''} with batch assignments. 
          Total batches across all courses: <strong>{courses.reduce((sum: number, c: any) => sum + (c.batchesCount || 0), 0)}</strong>
        </div>
      )}

      <div className="grid gap-4">
        {courses.map((course: any) => {
          const hasBatches = course.batches && Array.isArray(course.batches) && course.batches.length > 0
          const isExpanded = expandedCourses.has(course._id)

          const toggleExpand = () => {
            const newExpanded = new Set(expandedCourses)
            if (isExpanded) {
              newExpanded.delete(course._id)
            } else {
              newExpanded.add(course._id)
            }
            setExpandedCourses(newExpanded)
          }

          return (
            <div key={course._id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{course.title}</h3>
                    {hasBatches && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                        {course.batchesCount || 0} Batches
                      </span>
                    )}
                    {course.isPlaceholderOnly && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                        Ready for Members
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mb-4">{course.description}</p>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {course.duration} minutes
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Created: {new Date(course.dueDate || course.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {course.batchDetails?.currentParticipants || 0} Members
                    </div>
                    {hasBatches && (
                      <>
                        <div className="flex items-center gap-1">
                          <Layers className="w-4 h-4" />
                          {course.classesCount || 0} Classes
                        </div>
                        {course.stations && course.stations.length > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Stations:</span>
                            <span>{course.stations.length}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Batch Details */}
                  {hasBatches && (
                    <div className="mt-4 border-t pt-4">
                      <button
                        onClick={toggleExpand}
                        className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-4 h-4" />
                            Hide Batch Details
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4" />
                            Show Batch Details
                          </>
                        )}
                      </button>

                      {isExpanded && (
                        <div className="mt-3 space-y-3">
                          {course.batches.map((batch: any) => (
                            <div key={batch.batchNumber} className="bg-gray-50 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-gray-900">
                                  Batch {batch.batchNumber}
                                </h4>
                                <span className="text-sm text-gray-600">
                                  {batch.classes.length} Classes
                                </span>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                                {batch.classes.map((classItem: any) => (
                                  <div
                                    key={classItem.classNumber}
                                    className="bg-white rounded p-2 text-center border"
                                  >
                                    <div className="text-xs text-gray-500">Class {classItem.classNumber}</div>
                                    <div className="text-sm font-semibold text-gray-900">
                                      {classItem.memberCount} Members
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                          
                          {course.courseInfo && (
                            <div className="bg-blue-50 rounded-lg p-3 text-sm">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <span className="font-medium">Timing:</span> {course.courseInfo.timing}
                                </div>
                                <div>
                                  <span className="font-medium">Year:</span> {course.courseInfo.batchYear}
                                </div>
                                {course.courseInfo.batchMonths && course.courseInfo.batchMonths.length > 0 && (
                                  <div className="col-span-2">
                                    <span className="font-medium">Months:</span>{' '}
                                    {course.courseInfo.batchMonths.join(', ')}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 ml-4">
                  {hasBatches && (
                    <button
                      onClick={() => {
                        window.location.href = `/courses?view=${encodeURIComponent(course.title)}`
                      }}
                      className="p-2 text-green-500 hover:bg-green-50 rounded"
                      title="View batch details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(course)}
                    className="p-2 text-blue-500 hover:bg-blue-50 rounded"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(course._id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {courses.length === 0 && !loading && (
        <div className="text-center py-12 bg-white rounded-lg shadow border-2 border-dashed border-gray-300">
          <Layers className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No courses with batch assignments yet</h3>
          <p className="text-gray-500 mb-4 max-w-md mx-auto">
            Batch assignments will appear here after you create batches. To create batches:
          </p>
          <div className="text-sm text-gray-600 space-y-2 max-w-md mx-auto mb-6">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-3 text-left rounded">
              <p className="font-medium text-blue-900 mb-2">Steps to create batches:</p>
              <ol className="list-decimal list-inside space-y-1 text-blue-800">
                <li>Upload an Excel file with crew member data using the upload feature</li>
                <li>During upload, specify course details and batch configuration</li>
                <li>Batches will be automatically assigned to members</li>
                <li>Courses with batches will appear here automatically</li>
              </ol>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Refresh to Check for New Batches
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <p className="font-medium">Error loading courses</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}