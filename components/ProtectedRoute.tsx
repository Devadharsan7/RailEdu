'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getAuth, UserType } from '@/lib/auth'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedUserTypes?: UserType[]
}

export default function ProtectedRoute({
  children,
  allowedUserTypes,
}: ProtectedRouteProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const user = getAuth()

    if (!user) {
      router.push('/login')
      return
    }

    // Check if user type is allowed for this route
    if (allowedUserTypes && !allowedUserTypes.includes(user.userType)) {
      // Redirect to appropriate dashboard
      if (user.userType === 'administrator') {
        router.push('/')
      } else {
        router.push('/dashboard')
      }
      return
    }

    setIsLoading(false)
  }, [router, pathname, allowedUserTypes])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}




