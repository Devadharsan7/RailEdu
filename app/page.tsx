'use client'

import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import MetricCard from '@/components/MetricCard'
import CourseProgressChart from '@/components/CourseProgressChart'
import StatusBreakdownChart from '@/components/StatusBreakdownChart'
import UpcomingClasses from '@/components/UpcomingClasses'
import BatchManagement from '@/components/BatchManagement'
import ExcelUploadModal from '@/components/ExcelUploadModal'
import { Users, FileText, CheckCircle, MoreHorizontal, Plus } from 'lucide-react'
import { getAuthUser } from '@/lib/auth'

interface CrewCourse {
  statusReason: string
  classTimeFrom: string | null
  classTimeTo: string | null
}

interface Course {
  totalMembers: number
}

export default function Dashboard() {
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false)
  const [crewCourses, setCrewCourses] = useState<CrewCourse[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const user = typeof window !== 'undefined' ? getAuthUser() : null

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // Fetch crew courses
        const crewResponse = await fetch('/api/crew-courses/all')
        const crewData = await crewResponse.json()
        
        // Fetch courses
        const coursesResponse = await fetch(`/api/courses?type=admin-courses&adminId=${user?.id || 'ADM-8821'}`)
        const coursesData = await coursesResponse.json()
        
        if (crewData.success) {
          setCrewCourses(crewData.data || [])
        }
        
        if (coursesData.success) {
          setCourses(coursesData.courses || [])
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user?.id])

  // Calculate metrics
  const totalMembers = crewCourses.length
  const totalCourses = courses.length
  const totalAssigned = courses.reduce((sum, course) => sum + course.totalMembers, 0)
  
  // Status breakdown
  const completedCount = crewCourses.filter(c => c.statusReason === 'COMPLETED' || c.statusReason === 'completed').length
  const activeCount = crewCourses.filter(c => c.statusReason === 'ACTIVE' || c.statusReason === 'active').length
  const notStartedCount = totalMembers - completedCount - activeCount

  const handleAddClick = () => {
    setIsExcelModalOpen(true)
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
                <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
                <p className="text-gray-600 mt-1">Here is the summary of course and station data.</p>
              </div>
              <button
                onClick={handleAddClick}
                className="bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add
              </button>
            </div>

            {/* Metric Cards */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                      <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <MetricCard
                  title="Total Members"
                  value={totalMembers.toLocaleString()}
                  trend={0}
                  trendLabel=""
                  icon={Users}
                  iconColor="bg-blue-500"
                  trendColor="text-blue-600"
                />
                <MetricCard
                  title="Courses Assigned"
                  value={totalCourses.toString()}
                  trend={0}
                  trendLabel=""
                  icon={FileText}
                  iconColor="bg-blue-500"
                  trendColor="text-blue-600"
                />
                <MetricCard
                  title="Courses Completed"
                  value={completedCount.toLocaleString()}
                  trend={0}
                  trendLabel=""
                  icon={CheckCircle}
                  iconColor="bg-purple-500"
                  trendColor="text-purple-600"
                />
                <MetricCard
                  title="Not Started"
                  value={notStartedCount.toLocaleString()}
                  trend={0}
                  trendLabel=""
                  icon={MoreHorizontal}
                  iconColor="bg-orange-500"
                  trendColor="text-orange-600"
                />
              </div>
            )}

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <CourseProgressChart crewCourses={crewCourses} />
              <StatusBreakdownChart crewCourses={crewCourses} />
            </div>

            {/* Upcoming Classes */}
            <div className="mb-6">
              <UpcomingClasses />
            </div>

            {/* Batch Management */}
            <div className="mb-6">
              <BatchManagement />
            </div>
          </div>
        </main>
      </div>
      <ExcelUploadModal isOpen={isExcelModalOpen} onClose={() => setIsExcelModalOpen(false)} />
    </div>
    </ProtectedRoute>
  )
}

