'use client'

import { useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import AdminCoursesPage from '@/components/AdminCoursesPage'
import UserCoursesPage from '@/components/UserCoursesPage'
import { useAuth } from '@/lib/auth'

export default function CoursesPage() {
  const { user } = useAuth()

  return (
    <ProtectedRoute allowedUserTypes={['administrator', 'crew']}>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 ml-64">
          <Header />
          <main className="pt-16">
            {user?.userType === 'administrator' ? (
              <AdminCoursesPage adminId={user?.id || ''} />
            ) : (
              <UserCoursesPage userId={user?.id || ''} />
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
