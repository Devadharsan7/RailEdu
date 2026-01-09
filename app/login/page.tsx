'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Briefcase, Lock, Check, Settings, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { authenticate, saveAuth, CREDENTIALS } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = () => {
    setError('')
    
    if (!userId.trim() || !password.trim()) {
      setError('Please enter both ID and password')
      return
    }

    setIsLoading(true)

    // Simulate API call delay
    setTimeout(() => {
      const user = authenticate(userId.trim(), password)

      if (user) {
        saveAuth(user)
        // Redirect based on automatically detected user type
        if (user.userType === 'administrator') {
          router.push('/')
        } else {
          router.push('/dashboard')
        }
      } else {
        setError('Invalid credentials. Please check your ID and password.')
        setIsLoading(false)
      }
    }, 500)
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[600px]">
          {/* Left Section - Login Form */}
          <div className="p-8 lg:p-12 flex flex-col justify-center">
            {/* Branding */}
            <div className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 bg-primary-500 rounded grid grid-cols-2 gap-0.5 p-0.5">
                <div className="bg-white rounded-sm"></div>
                <div className="bg-white rounded-sm"></div>
                <div className="bg-white rounded-sm"></div>
                <div className="bg-white rounded-sm"></div>
              </div>
              <span className="text-2xl font-bold text-gray-800">LearnPoint</span>
            </div>

            {/* Welcome Message */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
              <p className="text-gray-600">Please enter your details to sign in.</p>
            </div>

            {/* User ID Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User ID
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => {
                    setUserId(e.target.value)
                    setError('')
                  }}
                  placeholder="e.g. ADM-8821 or STU-882910"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleLogin()
                    }
                  }}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError('')
                  }}
                  placeholder="Enter your password"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleLogin()
                    }
                  }}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Demo Credentials Info */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs font-semibold text-blue-900 mb-2">Demo Credentials:</p>
              <div className="space-y-1 text-xs text-blue-700">
                <p>Admin: <span className="font-mono">{CREDENTIALS.admin.id}</span> / <span className="font-mono">{CREDENTIALS.admin.password}</span></p>
                <p>Crew: <span className="font-mono">{CREDENTIALS.user.id}</span> / <span className="font-mono">{CREDENTIALS.user.password}</span></p>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="flex justify-end mb-6">
              <button
                onClick={() => alert('Forgot Password: Please contact your administrator to reset your password.')}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Forgot password?
              </button>
            </div>

            {/* Sign In Button */}
            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors mb-6 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                'Signing in...'
              ) : (
                <>
                  Sign In <span>→</span>
                </>
              )}
            </button>

            {/* Contact Support */}
            <div className="text-center text-sm text-gray-600">
              Having trouble?{' '}
              <button
                onClick={() => alert('Contact Support: Email: support@learnpoint.edu | Phone: 1-800-LEARN-PT')}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Contact Support
              </button>
            </div>
          </div>

          {/* Right Section - Promotional Panel */}
          <div className="bg-gradient-to-br from-blue-800 to-blue-900 p-8 lg:p-12 flex flex-col justify-center relative">
            {/* Station Status Card */}
            <div className="bg-gray-900/40 backdrop-blur-sm rounded-lg p-6 mb-8 border border-gray-700/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                  STATION STATUS
                </h3>
                <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-3xl font-bold text-white">Operational</h2>
              </div>
              <div className="w-full bg-gray-700/50 rounded-full h-2 mb-3">
                <div className="bg-primary-500 h-2 rounded-full" style={{ width: '94%' }}></div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Efficiency</span>
                <span className="text-lg font-semibold text-white">94%</span>
              </div>
            </div>

            {/* Main Heading */}
            <div className="mb-6">
              <div className="w-12 h-1 bg-primary-400 mb-4"></div>
              <h2 className="text-4xl font-bold text-white mb-2 leading-tight">
                Manage your{' '}
                <span className="relative inline-block">
                  courses
                  <span className="absolute -top-4 left-0 text-xs text-primary-300 font-normal whitespace-nowrap">
                    New Course Added
                  </span>
                </span>{' '}
                & stations efficiently.
              </h2>
            </div>

            {/* Description */}
            <p className="text-lg text-white/90 leading-relaxed">
              Streamline operations, track progress, and empower your crew with the LearnPoint management platform.
            </p>
          </div>
        </div>
      </div>

      {/* Settings Icon (Bottom Right) */}
      <button
        onClick={() => alert('Settings: System preferences and configuration options will be available here.')}
        className="fixed bottom-6 right-6 w-12 h-12 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center shadow-lg transition-colors cursor-pointer"
        title="Settings"
      >
        <Settings className="w-6 h-6 text-white" />
      </button>
    </div>
  )
}

