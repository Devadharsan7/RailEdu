// Authentication credentials
export const CREDENTIALS = {
  admin: {
    id: 'ADM-8821',
    password: 'admin123',
    userType: 'administrator' as const,
  },
  user: {
    id: 'STU-882910',
    password: 'user123',
    userType: 'crew' as const,
  },
}

export type UserType = 'administrator' | 'crew'

export interface AuthUser {
  id: string
  userType: UserType
  name: string
}

// Authentication functions - automatically determines user type based on credentials
export const authenticate = (
  id: string,
  password: string
): AuthUser | null => {
  // Try admin credentials first
  if (id === CREDENTIALS.admin.id && password === CREDENTIALS.admin.password) {
    return {
      id,
      userType: 'administrator',
      name: 'Alex Morgan',
    }
  }

  // Try crew/user credentials
  if (id === CREDENTIALS.user.id && password === CREDENTIALS.user.password) {
    return {
      id,
      userType: 'crew',
      name: 'Niko Flamini',
    }
  }

  return null
}

export const saveAuth = (user: AuthUser) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('authUser', JSON.stringify(user))
  }
}

export const getAuth = (): AuthUser | null => {
  if (typeof window !== 'undefined') {
    const authData = localStorage.getItem('authUser')
    if (authData) {
      return JSON.parse(authData)
    }
  }
  return null
}

// Alias for getAuth for consistency
export const getAuthUser = getAuth

export const clearAuth = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authUser')
  }
}

export const isAuthenticated = (): boolean => {
  return getAuth() !== null
}



