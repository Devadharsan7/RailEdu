import mongoose, { Schema, Document, Model } from 'mongoose'

// Excel File Schema
export interface IExcelFile extends Document {
  excelId: string
  excelName: string
  uploadedAt: Date
  uploadedBy: string
  totalRecords: number
  status: 'ACTIVE' | 'INACTIVE'
}

const ExcelFileSchema = new Schema<IExcelFile>(
  {
    excelId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    excelName: {
      type: String,
      required: true,
      index: true, // Index for fast lookup by name (re-upload logic)
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    uploadedBy: {
      type: String,
      required: true,
    },
    totalRecords: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
      required: true,
      index: true,
    },
  },
  {
    timestamps: false, // We're using uploadedAt instead
  }
)

// Crew Course Schema
export interface ICrewCourse extends Document {
  excelId: string
  division: {
    code: string // e.g., "MAS", "MS" - extracted from crewId prefix
  }
  crew: {
    crewId: string // numeric part only (e.g., "1456" from "MAS1456")
    crewName: string
  }
  designation: {
    code: string // e.g., LPM, SHT, MMAN
  }
  test: {
    testCode: string
    dueDate: Date
  }
  status: string
  reason?: string
  createdAt: Date
}

const CrewCourseSchema = new Schema<ICrewCourse>(
  {
    excelId: {
      type: String,
      required: true,
      index: true, // Index for fast queries by excelId
    },
    division: {
      code: {
        type: String,
        required: true,
        index: true, // Index for fast queries by division
      },
    },
    crew: {
      crewId: {
        type: String,
        required: true,
        index: true, // Index for fast queries by crewId
      },
      crewName: {
        type: String,
        required: true,
      },
    },
    designation: {
      code: {
        type: String,
        required: true,
        index: true, // Index for fast queries by designation
      },
    },
    test: {
      testCode: {
        type: String,
        required: true,
      },
      dueDate: {
        type: Date,
        required: true,
      },
    },
    status: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      required: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: false, // We're using createdAt instead
  }
)

// Compound indexes for efficient queries
// 1. Get distinct designations for a division
CrewCourseSchema.index({ 'division.code': 1, 'designation.code': 1 })

// 2. Get crews for a division + designation combination
CrewCourseSchema.index({ 'division.code': 1, 'designation.code': 1, 'crew.crewId': 1 })

// 3. Get all crews for a division
CrewCourseSchema.index({ 'division.code': 1, 'crew.crewId': 1 })

// 4. Query by excelId and division
CrewCourseSchema.index({ excelId: 1, 'division.code': 1 })

// Batch Assignment Schema
export interface IBatchAssignment extends Document {
  excelId: string
  crewCourseId: string // Reference to crew_courses document
  batchNumber: number // 1, 2, 3, etc.
  classNumber: number // Class within the batch (1, 2, 3, etc.)
  station: {
    id: string
    name: string
    code: string
  }
  course: {
    name: string
    timing: string
    batchMonths: string[]
    batchYear: number
  }
  assignedAt: Date
  alertSent: boolean
  lastAlertSentAt?: Date
  alertCount: number
  // Assigned time window for the class (calculated based on closest due date)
  assignedTimeFrom?: Date // Start time for the assigned class period
  assignedTimeTo?: Date // End time for the assigned class period
}

const BatchAssignmentSchema = new Schema<IBatchAssignment>(
  {
    excelId: {
      type: String,
      required: true,
      index: true,
    },
    crewCourseId: {
      type: String,
      required: true,
      index: true,
    },
    batchNumber: {
      type: Number,
      required: true,
      index: true,
    },
    classNumber: {
      type: Number,
      required: true,
      index: true,
    },
    station: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      code: { type: String, required: true },
    },
    course: {
      name: { type: String, required: true },
      timing: { type: String, required: true },
      batchMonths: { type: [String], required: true },
      batchYear: { type: Number, required: true },
    },
    assignedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    alertSent: {
      type: Boolean,
      default: false,
      index: true,
    },
    lastAlertSentAt: {
      type: Date,
    },
    alertCount: {
      type: Number,
      default: 0,
    },
    assignedTimeFrom: {
      type: Date,
      index: true, // Indexed for rescheduling queries
    },
    assignedTimeTo: {
      type: Date,
      index: true, // Indexed for rescheduling queries
    },
  },
  {
    timestamps: false,
  }
)

// Compound indexes for efficient queries
BatchAssignmentSchema.index({ excelId: 1, batchNumber: 1, classNumber: 1 })
BatchAssignmentSchema.index({ crewCourseId: 1 })
BatchAssignmentSchema.index({ alertSent: 1, 'course.batchYear': 1, 'course.batchMonths': 1 })

// Alert Notification Schema
export interface IAlertNotification extends Document {
  crewCourseId: string
  batchAssignmentId: string
  memberName: string
  crewId: string
  divisionCode: string
  alertType: 'BATCH_ASSIGNED' | 'CLASS_REMINDER' | 'DUE_DATE_WARNING' | 'DUE_DATE_URGENT' | 'CLASS_SCHEDULED'
  message: string
  dueDate: Date
  batchNumber: number
  classNumber: number
  courseName: string
  sentAt: Date
  read: boolean
}

const AlertNotificationSchema = new Schema<IAlertNotification>(
  {
    crewCourseId: {
      type: String,
      required: true,
      index: true,
    },
    batchAssignmentId: {
      type: String,
      required: true,
      index: true,
    },
    memberName: {
      type: String,
      required: true,
    },
    crewId: {
      type: String,
      required: true,
      index: true,
    },
    divisionCode: {
      type: String,
      required: true,
      index: true,
    },
    alertType: {
      type: String,
      enum: ['BATCH_ASSIGNED', 'CLASS_REMINDER', 'DUE_DATE_WARNING', 'DUE_DATE_URGENT', 'CLASS_SCHEDULED'],
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
      index: true,
    },
    batchNumber: {
      type: Number,
      required: true,
    },
    classNumber: {
      type: Number,
      required: true,
    },
    courseName: {
      type: String,
      required: true,
    },
    sentAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: false,
  }
)

// Indexes for alert queries
AlertNotificationSchema.index({ crewId: 1, read: 1 })
AlertNotificationSchema.index({ dueDate: 1, alertType: 1 })
AlertNotificationSchema.index({ sentAt: -1 })

// Class Schedule Schema
export interface IClassSchedule extends Document {
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
    duration: number
  }>
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled'
  alertSent: boolean
  createdAt: Date
  updatedAt: Date
}

const ClassScheduleSchema = new Schema<IClassSchedule>(
  {
    scheduleId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    crewId: {
      type: String,
      required: true,
      index: true,
    },
    crewName: {
      type: String,
      required: true,
    },
    divisionCode: {
      type: String,
      required: true,
      index: true,
    },
    stationCode: {
      type: String,
      required: true,
      index: true,
    },
    scheduledDate: {
      type: Date,
      required: true,
      index: true,
    },
    startTime: {
      type: Date,
      required: true,
      index: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    classes: [
      {
        crewCourseId: { type: String, required: true },
        batchAssignmentId: { type: String, required: true },
        batchNumber: { type: Number, required: true },
        classNumber: { type: Number, required: true },
        courseName: { type: String, required: true },
        testCode: { type: String, required: true },
        dueDate: { type: Date, required: true },
        duration: { type: Number, required: true },
      },
    ],
    status: {
      type: String,
      enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
      default: 'scheduled',
      index: true,
    },
    alertSent: {
      type: Boolean,
      default: false,
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
)

// Indexes for class schedule queries
ClassScheduleSchema.index({ stationCode: 1, startTime: 1, status: 1 })
ClassScheduleSchema.index({ crewId: 1, status: 1 })
ClassScheduleSchema.index({ scheduledDate: 1, status: 1 })
ClassScheduleSchema.index({ startTime: 1, endTime: 1 })

// Export models (create if they don't exist)
export const ExcelFile: Model<IExcelFile> =
  mongoose.models.ExcelFile || mongoose.model<IExcelFile>('ExcelFile', ExcelFileSchema, 'excel_files')

export const CrewCourse: Model<ICrewCourse> =
  mongoose.models.CrewCourse || mongoose.model<ICrewCourse>('CrewCourse', CrewCourseSchema, 'crew_courses')

export const BatchAssignment: Model<IBatchAssignment> =
  mongoose.models.BatchAssignment || mongoose.model<IBatchAssignment>('BatchAssignment', BatchAssignmentSchema, 'batch_assignments')

export const AlertNotification: Model<IAlertNotification> =
  mongoose.models.AlertNotification || mongoose.model<IAlertNotification>('AlertNotification', AlertNotificationSchema, 'alert_notifications')

export const ClassSchedule: Model<IClassSchedule> =
  mongoose.models.ClassSchedule || mongoose.model<IClassSchedule>('ClassSchedule', ClassScheduleSchema, 'class_schedules')
