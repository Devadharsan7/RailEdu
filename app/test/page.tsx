'use client'

import { useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import SchedulingAlgorithm from '@/components/SchedulingAlgorithm'
import { useAuth } from '@/lib/auth'

export default function TestPage() {
  const { user } = useAuth()
  const [result, setResult] = useState<any>(null)

  const testScheduleClass = async () => {
    const response = await fetch('/api/schedule-algorithm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'scheduleClass',
        userId: user?.id || 'user123',
        classId: 'test-class-1'
      })
    })
    const data = await response.json()
    setResult(data)
  }

  const testCreateCourse = async () => {
    const response = await fetch('/api/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create',
        title: 'Test Course',
        description: 'This is a test course',
        duration: 60,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdBy: user?.id || 'admin123',
        batchDetails: {
          batchId: 'BATCH-001',
          maxParticipants: 20,
          currentParticipants: 0
        }
      })
    })
    const data = await response.json()
    setResult(data)
  }

  return (
    <ProtectedRoute allowedUserTypes={['administrator', 'crew']}>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 ml-64">
          <Header />
          <main className="pt-16 p-6">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-3xl font-bold mb-6">All Buttons Working Test</h1>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <button
                  onClick={testScheduleClass}
                  className="bg-blue-500 text-white p-4 rounded-lg hover:bg-blue-600"
                >
                  Test Schedule Class
                </button>
                
                <button
                  onClick={testCreateCourse}
                  className="bg-green-500 text-white p-4 rounded-lg hover:bg-green-600"
                >
                  Test Create Course
                </button>
                
                <button
                  onClick={() => window.location.href = '/courses'}
                  className="bg-purple-500 text-white p-4 rounded-lg hover:bg-purple-600"
                >
                  Go to Courses
                </button>
                
                <button
                  onClick={() => window.location.href = '/'}
                  className="bg-orange-500 text-white p-4 rounded-lg hover:bg-orange-600"
                >
                  Go to Dashboard
                </button>
                
                <button
                  onClick={() => {
                    const bell = document.querySelector('[title="Notifications"]') as HTMLButtonElement
                    if (bell) bell.click()
                  }}
                  className="bg-yellow-500 text-white p-4 rounded-lg hover:bg-yellow-600"
                >
                  Open Notifications
                </button>
                
                <button
                  onClick={() => {
                    const logout = document.querySelector('[title="Logout"]') as HTMLButtonElement
                    if (logout) logout.click()
                  }}
                  className="bg-red-500 text-white p-4 rounded-lg hover:bg-red-600"
                >
                  Test Logout
                </button>
              </div>

              <SchedulingAlgorithm />

              {result && (
                <div className="mt-6 bg-white rounded-lg shadow p-6">
                  <h3 className="font-semibold mb-2">Last Result:</h3>
                  <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}