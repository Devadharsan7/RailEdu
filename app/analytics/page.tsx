'use client'

import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, Users, BookOpen, Award, Clock } from 'lucide-react'
import { getAuthUser } from '@/lib/auth'

interface CrewCourse {
  crewId: string
  crewName: string
  testCode: string
  statusReason: string
  division: string
  station: string
  dueDate: string
  classTimeFrom: string | null
  classTimeTo: string | null
}

interface Course {
  title: string
  totalMembers: number
  totalBatches: number
  totalClasses: number
  stations: string[]
}

const COLORS = ['#3b82f6', '#60a5fa', '#f97316', '#a855f7', '#10b981', '#ef4444', '#f59e0b', '#06b6d4', '#8b5cf6', '#ec4899']

export default function AnalyticsPage() {
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
        console.error('Error fetching analytics data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user?.id])

  // Calculate metrics
  const totalUsers = crewCourses.length
  const totalCourses = courses.length
  const totalMembers = courses.reduce((sum, course) => sum + course.totalMembers, 0)
  const totalBatches = courses.reduce((sum, course) => sum + course.totalBatches, 0)
  
  // Status breakdown
  const statusCounts = crewCourses.reduce((acc, course) => {
    const status = course.statusReason || 'ACTIVE'
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const statusData = Object.entries(statusCounts).map(([name, value]) => ({
    name,
    value,
    color: COLORS[Object.keys(statusCounts).indexOf(name) % COLORS.length],
  }))

  // Course distribution by TEST CODE
  const testCodeCounts = crewCourses.reduce((acc, course) => {
    const testCode = course.testCode || 'UNKNOWN'
    acc[testCode] = (acc[testCode] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const courseDistributionData = Object.entries(testCodeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10) // Top 10
    .map(([name, value], index) => ({
      name,
      value,
      color: COLORS[index % COLORS.length],
    }))

  // Division distribution
  const divisionCounts = crewCourses.reduce((acc, course) => {
    const division = course.division || 'UNKNOWN'
    acc[division] = (acc[division] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const divisionData = Object.entries(divisionCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], index) => ({
      name,
      value,
      color: COLORS[index % COLORS.length],
    }))

  // Course statistics (members per course)
  const courseStatsData = courses
    .sort((a, b) => b.totalMembers - a.totalMembers)
    .slice(0, 8)
    .map((course) => ({
      name: course.title.length > 15 ? course.title.substring(0, 15) + '...' : course.title,
      members: course.totalMembers,
      batches: course.totalBatches,
      classes: course.totalClasses,
    }))

  // Batch distribution - sorted by timeline based on earliest due date for each course
  // Group crew courses by TEST CODE to find earliest due date for each course
  const courseTimeline = new Map<string, Date>()
  crewCourses.forEach(course => {
    const testCode = course.testCode || 'UNKNOWN'
    if (course.dueDate && course.dueDate !== 'N/A') {
      try {
        const dueDate = new Date(course.dueDate.split('-').reverse().join('-')) // Convert DD-MM-YYYY to Date
        if (!isNaN(dueDate.getTime())) {
          if (!courseTimeline.has(testCode) || dueDate < courseTimeline.get(testCode)!) {
            courseTimeline.set(testCode, dueDate)
          }
        }
      } catch (e) {
        // Skip invalid dates
      }
    }
  })

  const batchData = courses
    .filter(course => course.totalBatches > 0)
    .map((course) => {
      const earliestDueDate = courseTimeline.get(course.title) || new Date()
      return {
        name: course.title,
        batches: course.totalBatches,
        classes: course.totalClasses,
        timeline: earliestDueDate.getTime(),
      }
    })
    .sort((a, b) => a.timeline - b.timeline) // Sort by timeline (earliest due date)
    .map((course) => ({
      name: course.name,
      batches: course.batches,
      classes: course.classes,
    }))

  if (isLoading) {
    return (
      <ProtectedRoute allowedUserTypes={['administrator']}>
        <div className="flex min-h-screen bg-gray-50">
          <Sidebar />
          <div className="flex-1 ml-64">
            <Header />
            <main className="pt-16 p-8">
              <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                  <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading analytics...</p>
                </div>
              </div>
            </main>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedUserTypes={['administrator']}>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 ml-64">
          <Header />
          <main className="pt-16 p-8">
            <div className="max-w-7xl mx-auto">
              {/* Page Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
                <p className="text-gray-600">Comprehensive insights and performance metrics</p>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">{totalUsers.toLocaleString()}</h3>
                  <p className="text-sm text-gray-600">Total Users</p>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <BookOpen className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">{totalCourses}</h3>
                  <p className="text-sm text-gray-600">Total Courses</p>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Award className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">{totalMembers.toLocaleString()}</h3>
                  <p className="text-sm text-gray-600">Total Members</p>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <Clock className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">{totalBatches}</h3>
                  <p className="text-sm text-gray-600">Total Batches</p>
                </div>
              </div>

              {/* Charts Row 1 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Course Distribution by TEST CODE */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-8">Course Distribution (by TEST CODE)</h3>
                  {courseDistributionData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={courseDistributionData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {courseDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            padding: '12px',
                          }}
                          formatter={(value: number, name: string, props: any) => {
                            const total = courseDistributionData.reduce((sum, item) => sum + item.value, 0)
                            const percent = ((value / total) * 100).toFixed(0)
                            return `${props.payload.name}: ${percent}%`
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-gray-500">
                      No data available
                    </div>
                  )}
                </div>

                {/* Status Breakdown */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-8">Status Breakdown</h3>
                  {statusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            padding: '12px',
                          }}
                          formatter={(value: number) => `${value} users`}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-gray-500">
                      No data available
                    </div>
                  )}
                </div>
              </div>

              {/* Charts Row 2 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Division Distribution */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-8">Users by Division</h3>
                  {divisionData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={divisionData.slice(0, 10)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="name" 
                          stroke="#6b7280" 
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis stroke="#6b7280" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                          }}
                          formatter={(value: number) => `${value} users`}
                        />
                        <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-gray-500">
                      No data available
                    </div>
                  )}
                </div>

                {/* Course Members Distribution */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-8">Members per Course (Top Courses)</h3>
                  {courseStatsData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={courseStatsData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="name" 
                          stroke="#6b7280"
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis stroke="#6b7280" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                          }}
                        />
                        <Bar dataKey="members" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-gray-500">
                      No data available
                    </div>
                  )}
                </div>
              </div>

              {/* Charts Row 3 - Batch and Class Distribution */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-8">Batches and Classes Distribution</h3>
                {batchData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={batchData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="name" 
                        stroke="#6b7280"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        interval={0}
                      />
                      <YAxis yAxisId="left" stroke="#6b7280" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="batches"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        name="Batches"
                        dot={{ fill: '#3b82f6', r: 4 }}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="classes"
                        stroke="#10b981"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name="Classes"
                        dot={{ fill: '#10b981', r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-gray-500">
                    No data available
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
