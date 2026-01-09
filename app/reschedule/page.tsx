'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import StudentSidebar from '@/components/StudentSidebar'
import StudentHeader from '@/components/StudentHeader'
import { ArrowLeft, Check, MoreVertical } from 'lucide-react'
import { rescheduleStorage, notificationStorage } from '@/lib/storage'
import { getAuthUser } from '@/lib/auth'

function RescheduleContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const courseParam = searchParams.get('course') || 'Locomotive Engineering (LE-201)'

  const [selectedCourse, setSelectedCourse] = useState(courseParam)
  const [selectedPeriod, setSelectedPeriod] = useState('mar-apr')
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const courses = [
    'Railway Safety and Operations (RSO-101)',
    'Locomotive Engineering (LE-201)',
    'Signal and Telecommunication Systems (STS-301)',
    'Track Maintenance and Infrastructure (TMI-401)',
    'Railway Traffic Management (RTM-501)',
    'Freight Operations (FO-601)',
  ]

  const handleSubmit = () => {
    if (!reason.trim()) {
      alert('Please provide a reason for the reschedule request.')
      return
    }

    setIsSubmitting(true)
    
    // Save to storage
    const user = getAuthUser()
    const periodText = selectedPeriod === 'mar-apr' ? 'Mar - Apr' : 'May - Jun'
    
    const request = {
      id: Date.now().toString(),
      course: selectedCourse,
      currentPeriod: 'Jan - Feb (Mon/Wed)',
      desiredPeriod: periodText,
      reason: reason,
      status: 'Pending' as const,
      createdAt: new Date().toISOString(),
      userId: user?.id || 'unknown',
    }
    
    rescheduleStorage.save(request)
    
    // Add notification
    notificationStorage.add({
      title: 'Reschedule Request Submitted',
      message: `Your request for ${selectedCourse} has been submitted and is pending review.`,
      type: 'info',
    })
    
    setTimeout(() => {
      setReason('')
      setIsSubmitting(false)
      router.push('/dashboard')
    }, 1000)
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <StudentSidebar />
      <div className="flex-1 ml-64">
        <StudentHeader />
        <main className="pt-16 p-6">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Reschedule Class</h1>
                  <p className="text-sm text-gray-600">
                    Submit a request to change time slots.
                  </p>
                </div>
                <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Select Course */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Course
                  </label>
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {courses.map((course) => (
                      <option key={course} value={course}>
                        {course}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Current Period */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700 font-medium">Jan - Feb</p>
                      <p className="text-xs text-gray-600 mt-1">Mon/Wed</p>
                    </div>
                    <div className="text-gray-400">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Desired Period */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Desired Period
                  </label>
                  <div className="space-y-2">
                    <button
                      onClick={() => setSelectedPeriod('mar-apr')}
                      className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
                        selectedPeriod === 'mar-apr'
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">Mar - Apr</span>
                        {selectedPeriod === 'mar-apr' && (
                          <div className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                    <button
                      onClick={() => setSelectedPeriod('may-jun')}
                      className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
                        selectedPeriod === 'may-jun'
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">May - Jun</span>
                        {selectedPeriod === 'may-jun' && (
                          <div className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  </div>
                </div>

                {/* Reason for Change */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Change
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    placeholder="e.g. Schedule conflict with internship..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function ReschedulePage() {
  return (
    <ProtectedRoute allowedUserTypes={['crew']}>
      <Suspense fallback={
        <div className="flex min-h-screen bg-gray-50">
          <StudentSidebar />
          <div className="flex-1 ml-64">
            <StudentHeader />
            <main className="pt-16 p-6">
              <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
                    <div className="space-y-4">
                      <div className="h-10 bg-gray-200 rounded"></div>
                      <div className="h-20 bg-gray-200 rounded"></div>
                      <div className="h-10 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      }>
        <RescheduleContent />
      </Suspense>
    </ProtectedRoute>
  )
}
