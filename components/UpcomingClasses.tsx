'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Clock, MapPin, CheckCircle, AlertCircle, MoreVertical, Edit } from 'lucide-react'

interface Class {
  date: string
  course: string
  time: string
  location: string
  status: 'Confirmed' | 'Upcoming' | 'Scheduled'
  highlight?: boolean
}

const classes: Class[] = [
  {
    date: 'Feb 14',
    course: 'Advanced Data Structures (CS-302)',
    time: '09:00 AM - 11:30 AM',
    location: 'Lab Station 4B',
    status: 'Confirmed',
  },
  {
    date: 'Feb 28',
    course: 'Web Architecture (CS-405)',
    time: '01:00 PM - 03:00 PM',
    location: 'Lecture Hall A',
    status: 'Upcoming',
    highlight: true,
  },
  {
    date: 'Mar 04',
    course: 'Database Management (CS-310)',
    time: '10:00 AM - 12:00 PM',
    location: 'Lab Station 2C',
    status: 'Scheduled',
  },
]

export default function UpcomingClasses() {
  const router = useRouter()
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null)
  const menuRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuIndex !== null) {
        const menuElement = menuRefs.current[openMenuIndex]
        if (menuElement && !menuElement.contains(event.target as Node)) {
          setOpenMenuIndex(null)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openMenuIndex])

  const handleReschedule = (course: string) => {
    setOpenMenuIndex(null)
    // Navigate to reschedule page with course parameter
    router.push(`/reschedule?course=${encodeURIComponent(course)}`)
  }

  const toggleMenu = (index: number) => {
    setOpenMenuIndex(openMenuIndex === index ? null : index)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return <CheckCircle className="w-4 h-4 text-blue-500" />
      case 'Upcoming':
        return <AlertCircle className="w-4 h-4 text-orange-500" />
      default:
        return <Calendar className="w-4 h-4 text-blue-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-blue-100 text-blue-800'
      case 'Upcoming':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Upcoming Classes</h3>
      </div>

      <div className="space-y-4">
        {classes.map((classItem, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border-2 transition-colors ${
              classItem.highlight
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">{classItem.date}</p>
                  <h4 className="text-base font-semibold text-gray-900 mt-1">
                    {classItem.course}
                  </h4>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(classItem.status)}
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    classItem.status
                  )}`}
                >
                  {classItem.status}
                </span>
                <div className="relative" ref={(el) => { menuRefs.current[index] = el }}>
                  <button
                    onClick={() => toggleMenu(index)}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    title="More options"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {openMenuIndex === index && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                      <button
                        onClick={() => handleReschedule(classItem.course)}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        Reschedule Class
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600 ml-16">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>{classItem.time}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                <span>{classItem.location}</span>
              </div>
            </div>

            {classItem.highlight && (
              <div className="mt-3 ml-16">
                <button
                  onClick={() => handleReschedule(classItem.course)}
                  className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Reschedule
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

