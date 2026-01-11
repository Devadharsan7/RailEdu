import { CrewCourse, BatchAssignment, AlertNotification, type IAlertNotification } from './models'

interface BatchAssignmentConfig {
  excelId: string
  station: {
    id: string
    name: string
    code: string
  }
  course: {
    name: string
    timing: string
    numberOfBatches: number
    membersPerClass: number
    batchMonths: string[]
    batchYear: number
  }
  testCode?: string // Optional: filter crew courses by test code
}

interface MemberWithDueDate {
  crewCourseId: string
  crewId: string
  crewName: string
  divisionCode: string
  designationCode: string
  dueDate: Date
}

/**
 * Algorithm to assign members to batches and classes based on due dates
 * 
 * Strategy:
 * 1. Sort members by due date (earliest first)
 * 2. Distribute members evenly across batches
 * 3. Within each batch, assign members to classes based on membersPerClass
 * 4. Prioritize members with earlier due dates for earlier batches
 */
export async function assignBatchesAndClasses(config: BatchAssignmentConfig): Promise<{
  success: boolean
  totalAssigned: number
  batches: Array<{
    batchNumber: number
    classes: Array<{
      classNumber: number
      members: number
    }>
  }>
  errors?: string[]
}> {
  try {
    const { excelId, station, course, testCode } = config
    const { numberOfBatches, membersPerClass } = course

    // Fetch all crew courses for this excelId, optionally filtered by test code
    const query: any = { excelId }
    if (testCode) {
      query['test.testCode'] = testCode
    }
    const crewCourses = await CrewCourse.find(query).lean()
    
    if (crewCourses.length === 0) {
      return {
        success: false,
        totalAssigned: 0,
        batches: [],
        errors: ['No crew courses found for this Excel file'],
      }
    }

    // Transform to member data with due dates
    const members: MemberWithDueDate[] = crewCourses.map((course) => ({
      crewCourseId: course._id.toString(),
      crewId: course.crew.crewId,
      crewName: course.crew.crewName,
      divisionCode: course.division.code,
      designationCode: course.designation.code,
      dueDate: new Date(course.test.dueDate),
    }))

    // Sort by due date (earliest first)
    members.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())

    // Calculate total capacity
    const totalCapacity = numberOfBatches * membersPerClass
    const totalMembers = members.length

    if (totalCapacity < totalMembers) {
      console.warn(
        `Warning: Total capacity (${totalCapacity}) is less than total members (${totalMembers}). Some members may not be assigned.`
      )
    }

    // Delete existing batch assignments for this excelId and course name (test code)
    // Only delete assignments for the specific course, not all courses
    await BatchAssignment.deleteMany({ 
      excelId,
      'course.name': course.name // Only delete assignments for this specific course (test code)
    })

    // Assign members to batches and classes
    const batchAssignments: Array<{
      crewCourseId: string
      batchNumber: number
      classNumber: number
    }> = []

    let memberIndex = 0
    const batchStats: Array<{
      batchNumber: number
      classes: Array<{
        classNumber: number
        members: number
      }>
    }> = []

    for (let batchNum = 1; batchNum <= numberOfBatches; batchNum++) {
      const classesInBatch: Array<{ classNumber: number; members: number }> = []
      let classNum = 1
      let membersInCurrentClass = 0

      // Calculate how many members should be in this batch
      // Distribute evenly, with remainder going to earlier batches
      const membersPerBatch = Math.floor(totalMembers / numberOfBatches)
      const remainder = totalMembers % numberOfBatches
      const targetMembersForBatch = membersPerBatch + (batchNum <= remainder ? 1 : 0)

      for (let i = 0; i < targetMembersForBatch && memberIndex < members.length; i++) {
        const member = members[memberIndex]

        // Check if current class is full
        if (membersInCurrentClass >= membersPerClass) {
          classesInBatch.push({
            classNumber: classNum,
            members: membersInCurrentClass,
          })
          classNum++
          membersInCurrentClass = 0
        }

        batchAssignments.push({
          crewCourseId: member.crewCourseId,
          batchNumber: batchNum,
          classNumber: classNum,
        })

        membersInCurrentClass++
        memberIndex++
      }

      // Add the last class if it has members
      if (membersInCurrentClass > 0) {
        classesInBatch.push({
          classNumber: classNum,
          members: membersInCurrentClass,
        })
      }

      batchStats.push({
        batchNumber: batchNum,
        classes: classesInBatch,
      })
    }

    // Insert batch assignments into database
    const assignmentsToInsert = batchAssignments.map((assignment) => ({
      excelId,
      crewCourseId: assignment.crewCourseId,
      batchNumber: assignment.batchNumber,
      classNumber: assignment.classNumber,
      station: {
        id: station.id,
        name: station.name,
        code: station.code,
      },
      course: {
        name: course.name,
        timing: course.timing,
        batchMonths: course.batchMonths,
        batchYear: course.batchYear,
      },
      assignedAt: new Date(),
      alertSent: false,
      alertCount: 0,
    }))

    // Insert batch assignments into database
    await BatchAssignment.insertMany(assignmentsToInsert)

    // Create initial batch assignment alerts
    await createBatchAssignmentAlerts(batchAssignments, members, course.name)

    // Mark batch assignments as having alerts sent (needed for scheduling algorithm)
    // Update all assignments for this excelId that were just created
    await BatchAssignment.updateMany(
      {
        excelId: excelId,
        alertSent: false, // Only update ones that haven't been marked yet
      },
      {
        $set: { alertSent: true },
      }
    )

    return {
      success: true,
      totalAssigned: batchAssignments.length,
      batches: batchStats,
    }
  } catch (error: any) {
    console.error('Error assigning batches:', error)
    return {
      success: false,
      totalAssigned: 0,
      batches: [],
      errors: [error.message || 'Unknown error occurred'],
    }
  }
}

/**
 * Create alert notifications when batches are assigned
 */
async function createBatchAssignmentAlerts(
  assignments: Array<{ crewCourseId: string; batchNumber: number; classNumber: number }>,
  members: MemberWithDueDate[],
  courseName: string
): Promise<void> {
  const memberMap = new Map<string, MemberWithDueDate>()
  members.forEach((m) => memberMap.set(m.crewCourseId, m))

  // Get batch assignments from database to get their IDs
  const crewCourseIds = assignments.map((a) => a.crewCourseId)
  const batchAssignments = await BatchAssignment.find({
    crewCourseId: { $in: crewCourseIds },
  }).lean()

  const assignmentMap = new Map<string, string>()
  batchAssignments.forEach((ba) => {
    assignmentMap.set(ba.crewCourseId, ba._id.toString())
  })

  const alerts = assignments
    .map((assignment) => {
      const member = memberMap.get(assignment.crewCourseId)
      if (!member) return null

      const batchAssignmentId = assignmentMap.get(assignment.crewCourseId)
      if (!batchAssignmentId) return null

      return {
        crewCourseId: assignment.crewCourseId,
        batchAssignmentId,
        memberName: member.crewName,
        crewId: member.crewId,
        divisionCode: member.divisionCode,
        alertType: 'BATCH_ASSIGNED' as const,
        message: `You have been assigned to Batch ${assignment.batchNumber}, Class ${assignment.classNumber} for ${courseName}. Please check your schedule.`,
        dueDate: member.dueDate,
        batchNumber: assignment.batchNumber,
        classNumber: assignment.classNumber,
        courseName,
        sentAt: new Date(),
        read: false,
      }
    })
    .filter((alert) => alert !== null) as Array<Omit<IAlertNotification, '_id'>>

  if (alerts.length > 0) {
    await AlertNotification.insertMany(alerts)
  }
}

/**
 * Check due dates and send appropriate alerts
 * This should be called periodically (e.g., daily via cron job)
 */
export async function checkDueDatesAndSendAlerts(): Promise<{
  success: boolean
  alertsSent: number
  errors?: string[]
}> {
  try {
    const now = new Date()
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000) // 3 days
    const oneDayFromNow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000) // 1 day

    // Find all active batch assignments with upcoming due dates
    const assignments = await BatchAssignment.find({
      alertSent: false, // Only check assignments that haven't been alerted yet
    }).lean()

    if (assignments.length === 0) {
      return {
        success: true,
        alertsSent: 0,
      }
    }

    // Get corresponding crew courses to check due dates
    const crewCourseIds = assignments.map((a) => a.crewCourseId)
    const crewCourses = await CrewCourse.find({
      _id: { $in: crewCourseIds },
    }).lean()

    const crewCourseMap = new Map()
    crewCourses.forEach((cc) => {
      crewCourseMap.set(cc._id.toString(), cc)
    })

    const alertsToCreate: Array<{
      crewCourseId: string
      batchAssignmentId: string
      memberName: string
      crewId: string
      divisionCode: string
      alertType: 'CLASS_REMINDER' | 'DUE_DATE_WARNING' | 'DUE_DATE_URGENT'
      message: string
      dueDate: Date
      batchNumber: number
      classNumber: number
      courseName: string
      sentAt: Date
      read: boolean
    }> = []
    const assignmentsToUpdate: Array<{ id: string; alertType: string }> = []

    for (const assignment of assignments) {
      const crewCourse = crewCourseMap.get(assignment.crewCourseId)
      if (!crewCourse) continue

      const dueDate = new Date(crewCourse.test.dueDate)
      let alertType: 'CLASS_REMINDER' | 'DUE_DATE_WARNING' | 'DUE_DATE_URGENT' | null = null
      let message = ''

      // Determine alert type based on how close the due date is
      if (dueDate <= oneDayFromNow && dueDate > now) {
        // Due within 1 day - URGENT
        alertType = 'DUE_DATE_URGENT'
        message = `URGENT: Your test for ${assignment.course.name} is due in less than 1 day! Batch ${assignment.batchNumber}, Class ${assignment.classNumber}.`
      } else if (dueDate <= threeDaysFromNow && dueDate > now) {
        // Due within 3 days - WARNING
        alertType = 'DUE_DATE_WARNING'
        message = `Warning: Your test for ${assignment.course.name} is due in 3 days. Batch ${assignment.batchNumber}, Class ${assignment.classNumber}. Please prepare.`
      } else if (dueDate <= sevenDaysFromNow && dueDate > now) {
        // Due within 7 days - REMINDER
        alertType = 'CLASS_REMINDER'
        message = `Reminder: Your test for ${assignment.course.name} is due in 7 days. Batch ${assignment.batchNumber}, Class ${assignment.classNumber}.`
      }

      if (alertType) {
        alertsToCreate.push({
          crewCourseId: assignment.crewCourseId,
          batchAssignmentId: assignment._id.toString(),
          memberName: crewCourse.crew.crewName,
          crewId: crewCourse.crew.crewId,
          divisionCode: crewCourse.division.code,
          alertType,
          message,
          dueDate,
          batchNumber: assignment.batchNumber,
          classNumber: assignment.classNumber,
          courseName: assignment.course.name,
          sentAt: new Date(),
          read: false,
        })

        assignmentsToUpdate.push({
          id: assignment._id.toString(),
          alertType,
        })
      }
    }

    // Insert alerts
    if (alertsToCreate.length > 0) {
      await AlertNotification.insertMany(alertsToCreate)

      // Update batch assignments to mark alerts as sent
      for (const update of assignmentsToUpdate) {
        await BatchAssignment.findByIdAndUpdate(update.id, {
          alertSent: true,
          lastAlertSentAt: new Date(),
          $inc: { alertCount: 1 },
        })
      }
    }

    return {
      success: true,
      alertsSent: alertsToCreate.length,
    }
  } catch (error: any) {
    console.error('Error checking due dates and sending alerts:', error)
    return {
      success: false,
      alertsSent: 0,
      errors: [error.message || 'Unknown error occurred'],
    }
  }
}


