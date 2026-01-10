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

// Export models (create if they don't exist)
export const ExcelFile: Model<IExcelFile> =
  mongoose.models.ExcelFile || mongoose.model<IExcelFile>('ExcelFile', ExcelFileSchema, 'excel_files')

export const CrewCourse: Model<ICrewCourse> =
  mongoose.models.CrewCourse || mongoose.model<ICrewCourse>('CrewCourse', CrewCourseSchema, 'crew_courses')
