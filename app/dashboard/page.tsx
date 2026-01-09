'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import StudentSidebar from '@/components/StudentSidebar'
import StudentHeader from '@/components/StudentHeader'
import StudentMetricCard from '@/components/StudentMetricCard'
import UpcomingClasses from '@/components/UpcomingClasses'
import { Calendar, Hourglass, CheckCircle, FileText } from 'lucide-react'

export default function StudentDashboard() {
  return (
    <ProtectedRoute allowedUserTypes={['crew']}>
    <div className="flex min-h-screen bg-gray-50">
      <StudentSidebar />
      <div className="flex-1 ml-64">
        <StudentHeader />
        <main className="pt-16 p-6">
          <div className="w-full">
            {/* Page Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Class Dashboard</h1>
              <p className="text-gray-600">
                Manage your course stations and view upcoming schedules.
              </p>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <StudentMetricCard
                title="Upcoming Classes"
                value="4 This Month"
                tag="+2 New"
                icon={Calendar}
                iconColor="bg-blue-500"
              />
              <StudentMetricCard
                title="Pending Requests"
                value="1 Processing"
                icon={Hourglass}
                iconColor="bg-orange-500"
              />
              <StudentMetricCard
                title="Completion Rate"
                value="12/14 Modules"
                subtitle="95%"
                icon={CheckCircle}
                iconColor="bg-blue-500"
              />
              <StudentMetricCard
                title="Current Grade"
                value="A-"
                subtitle="Good"
                icon={FileText}
                iconColor="bg-purple-500"
              />
            </div>

            {/* Upcoming Classes - Full Width */}
            <div className="mb-6">
              <UpcomingClasses />
            </div>
          </div>
        </main>
      </div>
    </div>
    </ProtectedRoute>
  )
}

