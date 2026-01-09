'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import StudentSidebar from '@/components/StudentSidebar'
import StudentHeader from '@/components/StudentHeader'
import { Calendar, Clock, MapPin, CheckCircle, AlertCircle } from 'lucide-react'

interface ScheduleItem {
  id: string
  date: string
  course: string
  code: string
  time: string
  location: string
  instructor: string
  status: 'Confirmed' | 'Upcoming' | 'Scheduled' | 'Completed'
}

const scheduleItems: ScheduleItem[] = [
  {
    id: '1',
    date: 'Feb 14',
    course: 'Advanced Data Structures',
    code: 'CS-302',
    time: '09:00 AM - 11:30 AM',
    location: 'Lab Station 4B',
    instructor: 'Prof. Mike Johnson',
    status: 'Completed',
  },
  {
    id: '2',
    date: 'Feb 28',
    course: 'Web Architecture',
    code: 'CS-405',
    time: '01:00 PM - 03:00 PM',
    location: 'Lecture Hall A',
    instructor: 'Dr. Sarah Williams',
    status: 'Upcoming',
  },
  {
    id: '3',
    date: 'Mar 04',
    course: 'Database Management',
    code: 'CS-310',
    time: '10:00 AM - 12:00 PM',
    location: 'Lab Station 2C',
    instructor: 'Prof. Tom Brown',
    status: 'Scheduled',
  },
  {
    id: '4',
    date: 'Mar 10',
    course: 'Machine Learning Basics',
    code: 'CS-450',
    time: '02:00 PM - 04:00 PM',
    location: 'Lecture Hall B',
    instructor: 'Dr. Emily Davis',
    status: 'Scheduled',
  },
]

export default function SchedulePage() {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="w-4 h-4 text-blue-500" />
      case 'Upcoming':
        return <AlertCircle className="w-4 h-4 text-orange-500" />
      default:
        return <Calendar className="w-4 h-4 text-blue-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-blue-100 text-blue-800'
      case 'Upcoming':
        return 'bg-orange-100 text-orange-800'
      case 'Scheduled':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <ProtectedRoute allowedUserTypes={['crew']}>
      <div className="flex min-h-screen bg-gray-50">
        <StudentSidebar />
        <div className="flex-1 ml-64">
          <StudentHeader />
          <main className="pt-16 p-6">
            <div className="max-w-7xl mx-auto">
              {/* Page Header */}
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">My Schedule</h1>
                <p className="text-gray-600">View and manage your class schedule</p>
              </div>

              {/* Schedule List */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Upcoming Classes</h2>
                  <select className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option>This Semester</option>
                    <option>Next Semester</option>
                    <option>All</option>
                  </select>
                </div>

                <div className="space-y-4">
                  {scheduleItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-primary-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">{item.date}</p>
                            <h4 className="text-base font-semibold text-gray-900 mt-1">
                              {item.course} ({item.code})
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">Instructor: {item.instructor}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(item.status)}
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              item.status
                            )}`}
                          >
                            {item.status}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600 ml-16">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          <span>{item.time}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4" />
                          <span>{item.location}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}


