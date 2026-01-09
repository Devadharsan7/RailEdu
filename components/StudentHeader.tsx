'use client'

import { useRouter } from 'next/navigation'
import { Search, MessageCircle, Bell, User, LogOut } from 'lucide-react'

export default function StudentHeader() {
  const router = useRouter()

  const handleLogout = () => {
    // Clear authentication data
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authUser')
    }
    router.push('/login')
  }

  return (
    <header className="bg-white border-b border-gray-200 h-16 fixed top-0 left-64 right-0 z-10">
      <div className="h-full px-6 flex items-center justify-between">
        <div className="flex-1 max-w-2xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for courses, stations, or instructors..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => alert('Messages: You have 2 unread messages from your instructors.')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Messages"
          >
            <MessageCircle className="w-5 h-5" />
          </button>
          <button
            onClick={() => alert('Notifications: You have 1 new notification about your upcoming class schedule.')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Niko Flamini</p>
              <p className="text-xs text-gray-500">Student ID: 882910</p>
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
  )
}

