'use client'

import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import AddCourseModal from '@/components/AddCourseModal'
import { BookOpen, Users, Clock, Award, Plus, Search, Filter, Edit, Trash2 } from 'lucide-react'
import { courseStorage, type Course } from '@/lib/storage'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/Toast'

export default function CoursesPage() {
  const { toasts, success, error, removeToast } = useToast()
  const [courses, setCourses] = useState<Course[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)

  useEffect(() => {
    loadCourses()
  }, [])

  const loadCourses = () => {
    setCourses(courseStorage.getAll())
  }

  const filteredCourses = courses.filter(course => {
    const matchesSearch = courseStorage.search(searchQuery).some(c => c.id === course.id)
    const matchesFilter = statusFilter === 'all' || course.status === statusFilter
    return matchesSearch && matchesFilter
  })

  const handleAddCourse = (courseData: Omit<Course, 'id' | 'createdAt'>) => {
    const newCourse: Course = {
      ...courseData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    }
    courseStorage.save(newCourse)
    loadCourses()
    success('Course added successfully!')
  }

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course)
    setIsAddModalOpen(true)
  }

  const handleUpdateCourse = (courseData: Omit<Course, 'id' | 'createdAt'>) => {
    if (editingCourse) {
      const updatedCourse: Course = {
        ...courseData,
        id: editingCourse.id,
        createdAt: editingCourse.createdAt,
      }
      courseStorage.save(updatedCourse)
      loadCourses()
      setEditingCourse(null)
      success('Course updated successfully!')
    }
  }

  const handleDeleteCourse = (id: string) => {
    const course = courseStorage.getById(id)
    if (course && confirm(`Are you sure you want to delete "${course.title}"?`)) {
      courseStorage.delete(id)
      loadCourses()
      success('Course deleted successfully!')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-blue-100 text-blue-800'
      case 'In Progress':
        return 'bg-blue-50 text-blue-700'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <ProtectedRoute allowedUserTypes={['administrator']}>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 ml-64">
          <Header />
          <main className="pt-16 p-6">
            <div className="max-w-7xl mx-auto">
              {/* Page Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
                  <p className="text-gray-600 mt-1">Manage and view all courses</p>
                </div>
                <button
                  onClick={() => {
                    setEditingCourse(null)
                    setIsAddModalOpen(true)
                  }}
                  className="bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Course
                </button>
              </div>

              {/* Search and Filter */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search courses..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Status</option>
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              {/* Courses Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {filteredCourses.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No courses found matching your search.</p>
                  </div>
                ) : (
                  filteredCourses.map((course) => (
                    <div key={course.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow relative group">
                      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditCourse(course)}
                          className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                          title="Edit course"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCourse(course.id)}
                          className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                          title="Delete course"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-primary-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{course.title}</h3>
                          <p className="text-sm text-gray-500">{course.code}</p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(course.status)}`}>
                        {course.status}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="w-4 h-4" />
                        <span>Instructor: {course.instructor}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{course.duration}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="w-4 h-4" />
                        <span>{course.enrolled} Students</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Progress</span>
                        <span className="text-sm font-semibold text-gray-900">{course.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-500 h-2 rounded-full transition-all"
                          style={{ width: `${course.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Grade */}
                    {course.grade && (
                      <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                        <Award className="w-5 h-5 text-yellow-500" />
                        <span className="text-sm font-semibold text-gray-900">Grade: {course.grade}</span>
                      </div>
                    )}
                    </div>
                  ))
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="text-sm text-gray-600 mb-1">Total Courses</div>
                  <div className="text-2xl font-bold text-gray-900">{courses.length}</div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="text-sm text-gray-600 mb-1">In Progress</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {courses.filter(c => c.status === 'In Progress').length}
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="text-sm text-gray-600 mb-1">Completed</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {courses.filter(c => c.status === 'Completed').length}
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="text-sm text-gray-600 mb-1">Average Progress</div>
                  <div className="text-2xl font-bold text-primary-600">
                    {courses.length > 0 ? Math.round(courses.reduce((sum, c) => sum + c.progress, 0) / courses.length) : 0}%
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
      <AddCourseModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setEditingCourse(null)
        }}
        onSave={editingCourse ? handleUpdateCourse : handleAddCourse}
        editingCourse={editingCourse}
      />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ProtectedRoute>
  )
}
