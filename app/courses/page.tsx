'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { BookOpen, Users, Clock, CheckCircle, Award, Plus, Search, Filter } from 'lucide-react'

interface Course {
  id: string
  title: string
  code: string
  instructor: string
  progress: number
  status: 'In Progress' | 'Completed' | 'Not Started'
  grade?: string
  duration: string
  enrolled: number
}

const courses: Course[] = [
  {
    id: '1',
    title: 'Advanced Data Structures',
    code: 'CS-302',
    instructor: 'Prof. Mike Johnson',
    progress: 85,
    status: 'In Progress',
    grade: 'A-',
    duration: '14 weeks',
    enrolled: 32,
  },
  {
    id: '2',
    title: 'Web Architecture',
    code: 'CS-405',
    instructor: 'Dr. Sarah Williams',
    progress: 60,
    status: 'In Progress',
    duration: '10 weeks',
    enrolled: 28,
  },
  {
    id: '3',
    title: 'Database Management',
    code: 'CS-310',
    instructor: 'Prof. Tom Brown',
    progress: 100,
    status: 'Completed',
    grade: 'A',
    duration: '12 weeks',
    enrolled: 38,
  },
  {
    id: '4',
    title: 'Machine Learning Basics',
    code: 'CS-450',
    instructor: 'Dr. Emily Davis',
    progress: 0,
    status: 'Not Started',
    duration: '16 weeks',
    enrolled: 25,
  },
]

export default function CoursesPage() {
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
                  onClick={() => alert('Add Course: This feature allows you to add a new course to the system.')}
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
                    placeholder="Search courses..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Filter className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-700">Filter</span>
                </button>
              </div>

              {/* Courses Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {courses.map((course) => (
                  <div key={course.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
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
                ))}
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
                    {Math.round(courses.reduce((sum, c) => sum + c.progress, 0) / courses.length)}%
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
