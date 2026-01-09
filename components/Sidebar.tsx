'use client'

import { 
  LayoutDashboard, 
  Users,
  BookOpen,
  BarChart3,
  Settings
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-gray-100 border-r border-gray-200 h-screen fixed left-0 top-0 overflow-y-auto flex flex-col">
      <div className="p-6 flex-1">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-primary-500 rounded grid grid-cols-2 gap-0.5 p-0.5">
            <div className="bg-white rounded-sm"></div>
            <div className="bg-white rounded-sm"></div>
            <div className="bg-white rounded-sm"></div>
            <div className="bg-white rounded-sm"></div>
          </div>
          <span className="text-xl font-bold text-gray-900">LearnPoint</span>
        </div>

        <nav className="space-y-1">
          <Link
            href="/"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
              pathname === '/' 
                ? 'bg-primary-500 text-white' 
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </Link>
          
          <div className="mt-6">
            <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              MANAGEMENT
            </p>
            <Link
              href="/users"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                pathname === '/users' 
                  ? 'bg-primary-500 text-white' 
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Users className="w-5 h-5" />
              Users
            </Link>
            <Link
              href="/courses"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                pathname === '/courses' 
                  ? 'bg-primary-500 text-white' 
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              <BookOpen className="w-5 h-5" />
              Courses
            </Link>
          </div>

          <div className="mt-6">
            <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              REPORTS
            </p>
            <Link
              href="/analytics"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                pathname === '/analytics' 
                  ? 'bg-primary-500 text-white' 
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              Analytics
            </Link>
          </div>

          <div className="mt-6">
            <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              SYSTEM
            </p>
            <Link
              href="/settings"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                pathname === '/settings' 
                  ? 'bg-primary-500 text-white' 
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Settings className="w-5 h-5" />
              Settings
            </Link>
          </div>
        </nav>
      </div>
    </div>
  )
}

