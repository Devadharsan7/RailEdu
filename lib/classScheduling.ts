import { CrewCourse, BatchAssignment, AlertNotification, ClassSchedule, type IAlertNotification, type IClassSchedule } from './models'
import connectDB from './mongodb'

// Local interface for scheduling (before saving to DB)
interface ScheduleData {
  scheduleId: string
  crewId: string
  crewName: string
  divisionCode: string
  stationCode: string
  scheduledDate: Date
  startTime: Date
  endTime: Date
  classes: Array<{
    crewCourseId: string
    batchAssignmentId: string
    batchNumber: number
    classNumber: number
    courseName: string
    testCode: string
    dueDate: Date
    duration: number // in minutes
  }>
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled'
  alertSent: boolean
  createdAt: Date
  updatedAt: Date
}

// Scheduling configuration
interface SchedulingConfig {
  classDurationMinutes?: number // Default duration per class (default: 60 minutes)
  breakBetweenClasses?: number // Break time between classes in minutes (default: 15)
  bufferDaysBeforeDue?: number // Schedule classes this many days before due date (default: 7)
  workingHours?: {
    start: number // Hour (0-23)
    end: number // Hour (0-23)
  }
  daysOfWeek?: number[] // Allowed days (0=Sunday, 1=Monday, etc., default: [1-5] for weekdays)
}

const DEFAULT_CONFIG: SchedulingConfig = {
  classDurationMinutes: 60,
  breakBetweenClasses: 15,
  bufferDaysBeforeDue: 7,
  workingHours: { start: 9, end: 17 },
  daysOfWeek: [1, 2, 3, 4, 5], // Monday to Friday
}

interface UserClassInfo {
  crewId: string
  crewName: string
  divisionCode: string
  stationCode: string
  classes: Array<{
    crewCourseId: string
    batchAssignmentId: string
    batchNumber: number
    classNumber: number
    courseName: string
    testCode: string
    dueDate: Date
    timing: string // Original timing from batch assignment
  }>
  earliestDueDate: Date
}

/**
 * Main scheduling algorithm
 * 
 * Strategy:
 * 1. Fetch all users with their assigned classes from batch assignments
 * 2. Group classes by user (crewId + station)
 * 3. For each user, group all their classes into one session
 * 4. Schedule the session before the earliest due date
 * 5. Ensure no time conflicts for users from the same station
 * 6. Send alerts to users about their scheduled classes
 */
export async function scheduleClassesForUsers(
  config: SchedulingConfig = {}
): Promise<{
  success: boolean
  scheduled: number
  failed: number
  schedules: ScheduleData[]
  errors?: string[]
}> {
  try {
    await connectDB()

    const finalConfig = { ...DEFAULT_CONFIG, ...config }
    const schedules: ScheduleData[] = []
    const errors: string[] = []

    // Step 1: Get all batch assignments (exclude placeholders)
    const batchAssignments = await BatchAssignment.find({
      alertSent: true, // Only schedule for already assigned batches
      crewCourseId: { $not: { $regex: /^placeholder-/ } }, // Exclude placeholder assignments
      excelId: { $not: { $regex: /^config-/ } }, // Exclude config-based placeholders
    }).lean()

    if (batchAssignments.length === 0) {
      return {
        success: true,
        scheduled: 0,
        failed: 0,
        schedules: [],
        errors: ['No batch assignments found. Please assign batches first.'],
      }
    }

    // Step 2: Get crew course details
    const crewCourseIds = Array.from(new Set(batchAssignments.map((a) => a.crewCourseId)))
    const crewCourses = await CrewCourse.find({
      _id: { $in: crewCourseIds },
    }).lean()

    const crewCourseMap = new Map()
    crewCourses.forEach((cc) => {
      crewCourseMap.set(cc._id.toString(), cc)
    })

    // Step 3: Group assignments by user (crewId + station)
    const userClassesMap = new Map<string, UserClassInfo>()

    batchAssignments.forEach((assignment: any) => {
      const crewCourse = crewCourseMap.get(assignment.crewCourseId)
      if (!crewCourse) return

      // Use station code from batch assignment (more accurate) or fallback to division code
      const stationCode = assignment.station?.code || crewCourse.division.code
      const crewId = crewCourse.crew.crewId
      const key = `${stationCode}-${crewId}`

      if (!userClassesMap.has(key)) {
        userClassesMap.set(key, {
          crewId,
          crewName: crewCourse.crew.crewName,
          divisionCode: crewCourse.division.code,
          stationCode,
          classes: [],
          earliestDueDate: new Date(crewCourse.test.dueDate),
        })
      }

      const userInfo = userClassesMap.get(key)!
      const dueDate = new Date(crewCourse.test.dueDate)

      userInfo.classes.push({
        crewCourseId: assignment.crewCourseId,
        batchAssignmentId: assignment._id.toString(),
        batchNumber: assignment.batchNumber,
        classNumber: assignment.classNumber,
        courseName: assignment.course.name,
        testCode: crewCourse.test.testCode,
        dueDate,
        timing: assignment.course.timing,
      })

      // Update earliest due date
      if (dueDate < userInfo.earliestDueDate) {
        userInfo.earliestDueDate = dueDate
      }
    })

    // Step 4: Get existing schedules from database to avoid conflicts
    const existingSchedules = await ClassSchedule.find({
      status: { $in: ['scheduled', 'in-progress'] },
    })
      .sort({ startTime: 1 })
      .lean()

    // Convert to ScheduleData format
    const existingSchedulesFormatted: ScheduleData[] = existingSchedules.map((s: any) => ({
      scheduleId: s.scheduleId,
      crewId: s.crewId,
      crewName: s.crewName,
      divisionCode: s.divisionCode,
      stationCode: s.stationCode,
      scheduledDate: new Date(s.scheduledDate),
      startTime: new Date(s.startTime),
      endTime: new Date(s.endTime),
      classes: s.classes,
      status: s.status,
      alertSent: s.alertSent,
      createdAt: new Date(s.createdAt),
      updatedAt: new Date(s.updatedAt),
    }))

    // Step 5: Schedule classes for each user
    let scheduled = 0
    let failed = 0

    // Sort users by earliest due date (schedule urgent ones first)
    const usersArray = Array.from(userClassesMap.values())
    usersArray.sort((a, b) => a.earliestDueDate.getTime() - b.earliestDueDate.getTime())

    // Track all schedules (existing + new) to check conflicts
    const allSchedules = [...existingSchedulesFormatted]

    for (const userInfo of usersArray) {
      try {
        const schedule = await scheduleUserClasses(userInfo, finalConfig, allSchedules)
        if (schedule) {
          schedules.push(schedule)
          allSchedules.push(schedule) // Add to conflict check list
          scheduled++
        } else {
          failed++
          errors.push(`Failed to schedule classes for ${userInfo.crewName} (${userInfo.crewId}) - No available time slot found`)
        }
      } catch (error: any) {
        failed++
        errors.push(`Error scheduling for ${userInfo.crewName}: ${error.message}`)
      }
    }

    // Step 6: Save schedules to database and send alerts
    for (const schedule of schedules) {
      // Check if schedule already exists for this user
      const existingSchedule = await ClassSchedule.findOne({
        crewId: schedule.crewId,
        status: { $in: ['scheduled', 'in-progress'] },
      })

      if (!existingSchedule) {
        // Save new schedule
        await ClassSchedule.create({
          scheduleId: schedule.scheduleId,
          crewId: schedule.crewId,
          crewName: schedule.crewName,
          divisionCode: schedule.divisionCode,
          stationCode: schedule.stationCode,
          scheduledDate: schedule.scheduledDate,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          classes: schedule.classes,
          status: schedule.status,
          alertSent: false,
          createdAt: schedule.createdAt,
          updatedAt: schedule.updatedAt,
        })

        // Create and send alerts
        await createScheduleAlerts(schedule)
      }
    }

    return {
      success: true,
      scheduled,
      failed,
      schedules,
      errors: errors.length > 0 ? errors : undefined,
    }
  } catch (error: any) {
    console.error('Error in scheduleClassesForUsers:', error)
    return {
      success: false,
      scheduled: 0,
      failed: 0,
      schedules: [],
      errors: [error.message || 'Unknown error occurred'],
    }
  }
}

/**
 * Schedule all classes for a single user in one session
 */
async function scheduleUserClasses(
  userInfo: UserClassInfo,
  config: SchedulingConfig,
  existingSchedules: ScheduleData[]
): Promise<ScheduleData | null> {
  // Calculate total session duration
  const totalClasses = userInfo.classes.length
  const totalDuration =
    totalClasses * config.classDurationMinutes! +
    (totalClasses - 1) * config.breakBetweenClasses!

  // Find optimal schedule time
  const scheduledTime = findOptimalScheduleTime(
    userInfo.stationCode,
    userInfo.earliestDueDate,
    totalDuration,
    config,
    existingSchedules
  )

  if (!scheduledTime) {
    return null
  }

  const endTime = new Date(scheduledTime.getTime() + totalDuration * 60 * 1000)

  // Create schedule object
  const schedule: ScheduleData = {
    scheduleId: `${userInfo.stationCode}-${userInfo.crewId}-${Date.now()}`,
    crewId: userInfo.crewId,
    crewName: userInfo.crewName,
    divisionCode: userInfo.divisionCode,
    stationCode: userInfo.stationCode,
    scheduledDate: new Date(scheduledTime),
    startTime: scheduledTime,
    endTime,
    classes: userInfo.classes.map((c) => ({
      crewCourseId: c.crewCourseId,
      batchAssignmentId: c.batchAssignmentId,
      batchNumber: c.batchNumber,
      classNumber: c.classNumber,
      courseName: c.courseName,
      testCode: c.testCode,
      dueDate: c.dueDate,
      duration: config.classDurationMinutes || 60,
    })),
    status: 'scheduled',
    alertSent: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  return schedule
}

/**
 * Find optimal schedule time that:
 * 1. Is before the due date (with buffer)
 * 2. Doesn't conflict with other users from the same station
 * 3. Falls within working hours and allowed days
 */
function findOptimalScheduleTime(
  stationCode: string,
  dueDate: Date,
  durationMinutes: number,
  config: SchedulingConfig,
  existingSchedules: ScheduleData[]
): Date | null {
  const now = new Date()
  const bufferDate = new Date(dueDate)
  bufferDate.setDate(bufferDate.getDate() - (config.bufferDaysBeforeDue || 7))

  // Start checking from tomorrow (give at least 1 day notice)
  let checkDate = new Date(now)
  checkDate.setDate(checkDate.getDate() + 1)
  checkDate.setHours(config.workingHours?.start || 9, 0, 0, 0)

  const maxCheckDate = bufferDate < checkDate ? checkDate : bufferDate

  // Try to find a slot within the next 30 days
  const maxAttempts = 30
  let attempts = 0

  while (attempts < maxAttempts && checkDate <= maxCheckDate) {
    // Check if this day is allowed
    const dayOfWeek = checkDate.getDay()
    if (config.daysOfWeek && !config.daysOfWeek.includes(dayOfWeek)) {
      checkDate.setDate(checkDate.getDate() + 1)
      checkDate.setHours(config.workingHours?.start || 9, 0, 0, 0)
      attempts++
      continue
    }

    // Try different times throughout the day
    let checkTime = new Date(checkDate)
    const endHour = config.workingHours?.end || 17

    while (checkTime.getHours() < endHour) {
      const endTime = new Date(checkTime.getTime() + durationMinutes * 60 * 1000)

      // Check if this time slot conflicts with existing schedules from same station
      const hasConflict = existingSchedules.some((schedule) => {
        if (schedule.stationCode !== stationCode) return false
        if (schedule.status === 'cancelled' || schedule.status === 'completed') return false

        // Check for time overlap
        return (
          (checkTime >= schedule.startTime && checkTime < schedule.endTime) ||
          (endTime > schedule.startTime && endTime <= schedule.endTime) ||
          (checkTime <= schedule.startTime && endTime >= schedule.endTime)
        )
      })

      if (!hasConflict && endTime.getHours() <= endHour) {
        return checkTime
      }

      // Move to next hour
      checkTime.setHours(checkTime.getHours() + 1)
    }

    // Move to next day
    checkDate.setDate(checkDate.getDate() + 1)
    checkDate.setHours(config.workingHours?.start || 9, 0, 0, 0)
    attempts++
  }

  return null // No available slot found
}

/**
 * Create alert notifications for scheduled classes
 */
async function createScheduleAlerts(schedule: ScheduleData): Promise<void> {
  const classList = schedule.classes.map((c, index) => {
    const classStart = new Date(schedule.startTime)
    classStart.setMinutes(
      classStart.getMinutes() + index * (c.duration + 15) // 15 min break between classes
    )
    return `${index + 1}. ${c.courseName} (Batch ${c.batchNumber}, Class ${c.classNumber}) - ${formatTime(classStart)}`
  }).join('\n')

  const mainMessage = `Your classes have been scheduled!\n\nDate: ${formatDate(schedule.scheduledDate)}\nStart Time: ${formatTime(schedule.startTime)}\nEnd Time: ${formatTime(schedule.endTime)}\n\nClasses:\n${classList}\n\nPlease complete all classes in this session before returning to your station work.`

  // Create one main alert for the entire schedule
  const mainAlert: any = {
    crewCourseId: schedule.classes[0].crewCourseId, // Use first class as reference
    batchAssignmentId: schedule.classes[0].batchAssignmentId,
    memberName: schedule.crewName,
    crewId: schedule.crewId,
    divisionCode: schedule.divisionCode,
    alertType: 'CLASS_SCHEDULED',
    message: mainMessage,
    dueDate: schedule.classes[0].dueDate, // Use earliest due date
    batchNumber: schedule.classes[0].batchNumber,
    classNumber: schedule.classes[0].classNumber,
    courseName: `${schedule.classes.length} Classes Scheduled`,
    sentAt: new Date(),
    read: false,
  }

  await AlertNotification.create(mainAlert)

  // Also create individual alerts for each class (optional - for detailed tracking)
  const individualAlerts: any[] = schedule.classes.map((classItem) => {
    const classStart = new Date(schedule.startTime)
    const classIndex = schedule.classes.findIndex(c => c.crewCourseId === classItem.crewCourseId)
    classStart.setMinutes(classStart.getMinutes() + classIndex * (classItem.duration + 15))

    return {
      crewCourseId: classItem.crewCourseId,
      batchAssignmentId: classItem.batchAssignmentId,
      memberName: schedule.crewName,
      crewId: schedule.crewId,
      divisionCode: schedule.divisionCode,
      alertType: 'CLASS_REMINDER',
      message: `Your class "${classItem.courseName}" (Batch ${classItem.batchNumber}, Class ${classItem.classNumber}) is scheduled on ${formatDate(schedule.scheduledDate)} at ${formatTime(classStart)}. Please attend all your scheduled classes in this session.`,
      dueDate: classItem.dueDate,
      batchNumber: classItem.batchNumber,
      classNumber: classItem.classNumber,
      courseName: classItem.courseName,
      sentAt: new Date(),
      read: false,
    }
  })

  if (individualAlerts.length > 0) {
    await AlertNotification.insertMany(individualAlerts)
  }

  // Update schedule to mark alert as sent
  await ClassSchedule.findOneAndUpdate(
    { scheduleId: schedule.scheduleId },
    { alertSent: true, updatedAt: new Date() }
  )
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

