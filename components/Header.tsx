'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, User, LogOut } from 'lucide-react'
import { getAuthUser } from '@/lib/auth'
import { useUserAlerts, useAdminAlerts } from '@/hooks/useScheduler'
import NotificationsPanel from '@/components/NotificationsPanel'

export default function Header() {
  const router = useRouter()
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const user = typeof window !== 'undefined' ? getAuthUser() : null
  
  const { alerts: userAlerts } = useUserAlerts(user?.userType === 'crew' ? (user?.id || '') : '')
  const { alerts: adminAlerts } = useAdminAlerts(user?.userType === 'administrator' ? (user?.id || '') : '')
  
  const unreadCount = user?.userType === 'administrator' 
    ? (adminAlerts?.length || 0)
    : (userAlerts?.length || 0)

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authUser')
    }
    router.push('/login')
  }

  const handleNotificationClick = () => {
    setIsNotificationsOpen(true)
  }

  return (
    <>
      <header className="bg-gray-100 border-b border-gray-200 h-16 fixed top-0 left-64 right-0 z-10">
        <div className="h-full px-6 flex items-center justify-end">
          <div className="flex items-center gap-4">
            <button
              onClick={handleNotificationClick}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          <div className="flex items-center gap-3 pl-4 border-l border-gray-300">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-500">{user?.userType === 'administrator' ? 'Admin' : 'Crew'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="ml-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
    <NotificationsPanel 
      isOpen={isNotificationsOpen} 
      onClose={() => setIsNotificationsOpen(false)}
      userId={user?.id || ''}
      userType={user?.userType || 'crew'}
    />
    </>
  )
}

