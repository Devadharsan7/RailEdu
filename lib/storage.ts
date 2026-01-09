// Data storage utility using localStorage

export interface User {
  id: string
  name: string
  email: string
  role: string
  status: 'Active' | 'Inactive'
  joinDate: string
  phone?: string
  division?: string
  station?: string
  crewId?: string
}

export interface Station {
  id: string
  name: string
  code: string
  users: User[]
}

export interface Division {
  id: string
  name: string
  code: string
  stations: Station[]
}

export interface Batch {
  id: string
  course: string
  crewLimitPerClass: number
  classesPerBatch: number
  months: string[]
  createdAt: string
}

export interface Course {
  id: string
  title: string
  code: string
  instructor: string
  progress: number
  status: 'In Progress' | 'Completed' | 'Not Started'
  grade?: string
  duration: string
  enrolled: number
  createdAt: string
}

export interface RescheduleRequest {
  id: string
  course: string
  currentPeriod: string
  desiredPeriod: string
  reason: string
  status: 'Pending' | 'Approved' | 'Rejected'
  createdAt: string
  userId: string
}

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  createdAt: string
}

// Storage keys
const STORAGE_KEYS = {
  BATCHES: 'railedu_batches',
  COURSES: 'railedu_courses',
  RESCHEDULE_REQUESTS: 'railedu_reschedule_requests',
  NOTIFICATIONS: 'railedu_notifications',
  DIVISIONS: 'railedu_divisions',
}

// Generic storage functions
function getStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch {
    return defaultValue
  }
}

function setStorageItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error('Error saving to localStorage:', error)
  }
}

// Batch management
export const batchStorage = {
  getAll: (): Batch[] => getStorageItem(STORAGE_KEYS.BATCHES, []),
  save: (batch: Batch): void => {
    const batches = batchStorage.getAll()
    const existingIndex = batches.findIndex(b => b.id === batch.id)
    if (existingIndex >= 0) {
      batches[existingIndex] = batch
    } else {
      batches.push(batch)
    }
    setStorageItem(STORAGE_KEYS.BATCHES, batches)
  },
  delete: (id: string): void => {
    const batches = batchStorage.getAll().filter(b => b.id !== id)
    setStorageItem(STORAGE_KEYS.BATCHES, batches)
  },
  getById: (id: string): Batch | undefined => {
    return batchStorage.getAll().find(b => b.id === id)
  },
}

// Course management
export const courseStorage = {
  getAll: (): Course[] => {
    const stored = getStorageItem<Course[]>(STORAGE_KEYS.COURSES, [])
    
    // Check if stored courses contain old CS courses (migration check)
    const hasOldCourses = stored.some(c => c.code?.startsWith('CS-'))
    
    // If no stored courses or old courses detected, return/set default railway courses
    if (stored.length === 0 || hasOldCourses) {
      const defaultCourses: Course[] = [
        {
          id: '1',
          title: 'Railway Safety and Operations',
          code: 'RSO-101',
          instructor: 'Mr. Rajesh Kumar',
          progress: 85,
          status: 'In Progress',
          grade: 'A-',
          duration: '14 weeks',
          enrolled: 32,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Locomotive Engineering',
          code: 'LE-201',
          instructor: 'Dr. Priya Sharma',
          progress: 60,
          status: 'In Progress',
          duration: '10 weeks',
          enrolled: 28,
          createdAt: new Date().toISOString(),
        },
        {
          id: '3',
          title: 'Signal and Telecommunication Systems',
          code: 'STS-301',
          instructor: 'Mr. Anil Patel',
          progress: 100,
          status: 'Completed',
          grade: 'A',
          duration: '12 weeks',
          enrolled: 38,
          createdAt: new Date().toISOString(),
        },
        {
          id: '4',
          title: 'Track Maintenance and Infrastructure',
          code: 'TMI-401',
          instructor: 'Ms. Kavita Singh',
          progress: 0,
          status: 'Not Started',
          duration: '16 weeks',
          enrolled: 25,
          createdAt: new Date().toISOString(),
        },
        {
          id: '5',
          title: 'Railway Traffic Management',
          code: 'RTM-501',
          instructor: 'Mr. Suresh Reddy',
          progress: 75,
          status: 'In Progress',
          duration: '12 weeks',
          enrolled: 30,
          createdAt: new Date().toISOString(),
        },
        {
          id: '6',
          title: 'Freight Operations',
          code: 'FO-601',
          instructor: 'Dr. Meera Nair',
          progress: 45,
          status: 'In Progress',
          duration: '10 weeks',
          enrolled: 22,
          createdAt: new Date().toISOString(),
        },
      ]
      // Only set defaults if storage is empty or has old courses
      if (stored.length === 0 || hasOldCourses) {
        setStorageItem(STORAGE_KEYS.COURSES, defaultCourses)
        return defaultCourses
      }
    }
    return stored
  },
  save: (course: Course): void => {
    const courses = courseStorage.getAll()
    const existingIndex = courses.findIndex(c => c.id === course.id)
    if (existingIndex >= 0) {
      courses[existingIndex] = course
    } else {
      courses.push(course)
    }
    setStorageItem(STORAGE_KEYS.COURSES, courses)
  },
  delete: (id: string): void => {
    const courses = courseStorage.getAll().filter(c => c.id !== id)
    setStorageItem(STORAGE_KEYS.COURSES, courses)
  },
  getById: (id: string): Course | undefined => {
    return courseStorage.getAll().find(c => c.id === id)
  },
  search: (query: string): Course[] => {
    const courses = courseStorage.getAll()
    if (!query.trim()) return courses
    const lowerQuery = query.toLowerCase()
    return courses.filter(course =>
      course.title.toLowerCase().includes(lowerQuery) ||
      course.code.toLowerCase().includes(lowerQuery) ||
      course.instructor.toLowerCase().includes(lowerQuery)
    )
  },
}

// Reschedule requests
export const rescheduleStorage = {
  getAll: (): RescheduleRequest[] => getStorageItem(STORAGE_KEYS.RESCHEDULE_REQUESTS, []),
  save: (request: RescheduleRequest): void => {
    const requests = rescheduleStorage.getAll()
    requests.push(request)
    setStorageItem(STORAGE_KEYS.RESCHEDULE_REQUESTS, requests)
  },
  getByUserId: (userId: string): RescheduleRequest[] => {
    return rescheduleStorage.getAll().filter(r => r.userId === userId)
  },
  updateStatus: (id: string, status: 'Pending' | 'Approved' | 'Rejected'): void => {
    const requests = rescheduleStorage.getAll()
    const request = requests.find(r => r.id === id)
    if (request) {
      request.status = status
      setStorageItem(STORAGE_KEYS.RESCHEDULE_REQUESTS, requests)
    }
  },
}

// Notifications
export const notificationStorage = {
  getAll: (): Notification[] => getStorageItem(STORAGE_KEYS.NOTIFICATIONS, []),
  add: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>): void => {
    const notifications = notificationStorage.getAll()
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      read: false,
      createdAt: new Date().toISOString(),
    }
    notifications.unshift(newNotification)
    // Keep only last 50 notifications
    setStorageItem(STORAGE_KEYS.NOTIFICATIONS, notifications.slice(0, 50))
  },
  markAsRead: (id: string): void => {
    const notifications = notificationStorage.getAll()
    const notification = notifications.find(n => n.id === id)
    if (notification) {
      notification.read = true
      setStorageItem(STORAGE_KEYS.NOTIFICATIONS, notifications)
    }
  },
  markAllAsRead: (): void => {
    const notifications = notificationStorage.getAll()
    notifications.forEach(n => n.read = true)
    setStorageItem(STORAGE_KEYS.NOTIFICATIONS, notifications)
  },
  getUnreadCount: (): number => {
    return notificationStorage.getAll().filter(n => !n.read).length
  },
  delete: (id: string): void => {
    const notifications = notificationStorage.getAll().filter(n => n.id !== id)
    setStorageItem(STORAGE_KEYS.NOTIFICATIONS, notifications)
  },
}

// Division and User management
export const divisionStorage = {
  getAll: (): Division[] => {
    const stored = getStorageItem<Division[]>(STORAGE_KEYS.DIVISIONS, [])
    // If no stored divisions, return default divisions structure
    if (stored.length === 0) {
      const defaultDivisions: Division[] = [
        {
          id: '1',
          name: 'Chennai',
          code: 'MAS',
          stations: [
            { id: '1', name: 'Chennai Central', code: 'MAS', users: [] },
            { id: '2', name: 'Chennai Egmore', code: 'MS', users: [] },
            { id: '3', name: 'Tambaram', code: 'TBM', users: [] },
          ],
        },
        {
          id: '2',
          name: 'Madurai',
          code: 'MDU',
          stations: [
            { id: '4', name: 'Madurai Junction', code: 'MDU', users: [] },
            { id: '5', name: 'Tirunelveli Junction', code: 'TEN', users: [] },
            { id: '6', name: 'Dindigul', code: 'DG', users: [] },
          ],
        },
        {
          id: '3',
          name: 'Salem',
          code: 'SA',
          stations: [
            { id: '7', name: 'Salem Junction', code: 'SA', users: [] },
            { id: '8', name: 'Erode Junction', code: 'ED', users: [] },
            { id: '9', name: 'Coimbatore Junction', code: 'CBE', users: [] },
          ],
        },
        {
          id: '4',
          name: 'Tiruchirappalli',
          code: 'TPJ',
          stations: [
            { id: '10', name: 'Tiruchirappalli Junction', code: 'TPJ', users: [] },
            { id: '11', name: 'Thanjavur Junction', code: 'TJ', users: [] },
            { id: '12', name: 'Kumbakonam', code: 'KMU', users: [] },
          ],
        },
        {
          id: '5',
          name: 'Palakkad',
          code: 'PGT',
          stations: [
            { id: '13', name: 'Palakkad Junction', code: 'PGT', users: [] },
            { id: '14', name: 'Shoranur Junction', code: 'SRR', users: [] },
            { id: '15', name: 'Ottapalam', code: 'OTP', users: [] },
          ],
        },
        {
          id: '6',
          name: 'Thiruvananthapuram',
          code: 'TVC',
          stations: [
            { id: '16', name: 'Thiruvananthapuram Central', code: 'TVC', users: [] },
            { id: '17', name: 'Kollam Junction', code: 'QLN', users: [] },
            { id: '18', name: 'Alappuzha', code: 'ALLP', users: [] },
          ],
        },
      ]
      setStorageItem(STORAGE_KEYS.DIVISIONS, defaultDivisions)
      return defaultDivisions
    }
    return stored
  },
  save: (division: Division): void => {
    const divisions = divisionStorage.getAll()
    const existingIndex = divisions.findIndex(d => d.id === division.id)
    if (existingIndex >= 0) {
      divisions[existingIndex] = division
    } else {
      divisions.push(division)
    }
    setStorageItem(STORAGE_KEYS.DIVISIONS, divisions)
  },
  getById: (id: string): Division | undefined => {
    return divisionStorage.getAll().find(d => d.id === id)
  },
  addUsersToStation: (divisionId: string, stationCode: string, users: User[], stationName?: string): void => {
    const divisions = divisionStorage.getAll()
    const division = divisions.find(d => d.id === divisionId)
    if (division) {
      const station = division.stations.find(s => s.code === stationCode)
      if (station) {
        // Update station name if provided
        if (stationName && stationName !== station.name) {
          station.name = stationName
        }
        // Merge with existing users (avoid duplicates)
        const existingUserIds = new Set(station.users.map(u => u.id))
        const newUsers = users.filter(u => !existingUserIds.has(u.id))
        station.users = [...station.users, ...newUsers]
        divisionStorage.save(division)
      } else {
        // Create new station if it doesn't exist
        const newStation: Station = {
          id: `${divisionId}-${stationCode}-${Date.now()}`,
          name: stationName || `${stationCode} Station`,
          code: stationCode,
          users: users,
        }
        division.stations.push(newStation)
        divisionStorage.save(division)
      }
    }
  },
}

