'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, Users, BookOpen, Award } from 'lucide-react'

const attendanceData = [
  { batch: 'Jan-Feb', attendance: 1900 },
  { batch: 'Mar-Apr', attendance: 2020 },
  { batch: 'May-Jun', attendance: 2170 },
  { batch: 'Jul-Aug', attendance: 2060 },
  { batch: 'Sep-Oct', attendance: 2190 },
  { batch: 'Nov-Dec', attendance: 1970 },
]

const courseDistribution = [
  { name: 'Computer Science', value: 35, color: '#3b82f6' },
  { name: 'Mathematics', value: 25, color: '#60a5fa' },
  { name: 'Engineering', value: 20, color: '#f97316' },
  { name: 'Business', value: 15, color: '#a855f7' },
  { name: 'Other', value: 5, color: '#e5e7eb' },
]

const performanceData = [
  { batch: 'Jan-Feb', avgScore: 76.5, completion: 86.5 },
  { batch: 'Mar-Apr', avgScore: 83.5, completion: 91 },
  { batch: 'May-Jun', avgScore: 89, completion: 95 },
  { batch: 'Jul-Aug', avgScore: 91.5, completion: 96.5 },
  { batch: 'Sep-Oct', avgScore: 93.5, completion: 98 },
  { batch: 'Nov-Dec', avgScore: 95.5, completion: 99 },
]

export default function AnalyticsPage() {
  return (
    <ProtectedRoute allowedUserTypes={['administrator']}>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 ml-64">
          <Header />
          <main className="pt-16 p-6">
            <div className="max-w-7xl mx-auto">
              {/* Page Header */}
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
                <p className="text-gray-600">Comprehensive insights and performance metrics</p>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">2,845</h3>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-xs text-blue-600 mt-2">+12% from last month</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <BookOpen className="w-6 h-6 text-blue-600" />
                    </div>
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">1,204</h3>
                  <p className="text-sm text-gray-600">Active Courses</p>
                  <p className="text-xs text-blue-600 mt-2">+5% from last month</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Award className="w-6 h-6 text-purple-600" />
                    </div>
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">892</h3>
                  <p className="text-sm text-gray-600">Completions</p>
                  <p className="text-xs text-blue-600 mt-2">+8% from last month</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-orange-600" />
                    </div>
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">94.2%</h3>
                  <p className="text-sm text-gray-600">Success Rate</p>
                  <p className="text-xs text-blue-600 mt-2">+2.1% from last month</p>
                </div>
              </div>

              {/* Charts Row 1 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Attendance Trends</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={attendanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="batch" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="attendance" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Course Distribution</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={courseDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {courseDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Charts Row 2 */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Metrics</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="batch" stroke="#6b7280" />
                    <YAxis yAxisId="left" stroke="#6b7280" />
                    <YAxis yAxisId="right" orientation="right" stroke="#6b7280" />
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
                      dataKey="avgScore"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Average Score"
                      dot={{ fill: '#3b82f6', r: 4 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="completion"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Completion %"
                      dot={{ fill: '#3b82f6', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}


