'use client'

import { useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import MetricCard from '@/components/MetricCard'
import CourseProgressChart from '@/components/CourseProgressChart'
import StatusBreakdownChart from '@/components/StatusBreakdownChart'
import UpcomingClasses from '@/components/UpcomingClasses'
import BatchManagement from '@/components/BatchManagement'
import { Users, FileText, CheckCircle, MoreHorizontal } from 'lucide-react'

export default function Dashboard() {
  const handleAddEditContent = () => {
    alert('Add/Edit Content: This feature allows you to add or edit course content, stations, and other educational materials.')
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
                onClick={handleAddEditContent}
                className="bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center gap-2"
              >
                <span>+</span> Add / Edit Content
              </button>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <MetricCard
                title="Total Members"
                value="2,845"
                trend={12}
                trendLabel="+12%"
                icon={Users}
                iconColor="bg-blue-500"
                trendColor="text-blue-600"
              />
              <MetricCard
                title="Courses Assigned"
                value="1,204"
                trend={5}
                trendLabel="+5%"
                icon={FileText}
                iconColor="bg-blue-500"
                trendColor="text-blue-600"
              />
              <MetricCard
                title="Courses Completed"
                value="892"
                trend={8}
                trendLabel="+8%"
                icon={CheckCircle}
                iconColor="bg-purple-500"
                trendColor="text-purple-600"
              />
              <MetricCard
                title="Not Started"
                value="145"
                trend={-2}
                trendLabel="-2%"
                icon={MoreHorizontal}
                iconColor="bg-orange-500"
                trendColor="text-orange-600"
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <CourseProgressChart />
              <StatusBreakdownChart />
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
    </div>
    </ProtectedRoute>
  )
}

