# Batch Assignment and Alert Algorithm

## Overview

This system automatically assigns members to batches and classes based on their test due dates, and sends alerts to notify them about their assignments and upcoming deadlines.

## How It Works

### 1. Batch Assignment Algorithm

After an Excel file is uploaded, the system automatically:

1. **Fetches all members** from the uploaded Excel file
2. **Sorts members by due date** (earliest due dates first)
3. **Distributes members evenly** across the specified number of batches
4. **Assigns members to classes** within each batch based on `membersPerClass` setting
5. **Prioritizes earlier due dates** for earlier batches

#### Distribution Strategy:
- Members are sorted by due date (ascending)
- Total members are divided evenly across batches
- If there's a remainder, earlier batches get one extra member
- Within each batch, members are assigned to classes based on `membersPerClass`
- Each class can have up to `membersPerClass` members

**Example:**
- Total members: 200
- Number of batches: 4
- Members per class: 25
- Result:
  - Batch 1: 50 members (2 classes of 25)
  - Batch 2: 50 members (2 classes of 25)
  - Batch 3: 50 members (2 classes of 25)
  - Batch 4: 50 members (2 classes of 25)

### 2. Alert System

The system sends alerts at different stages:

#### A. Batch Assignment Alert
- **When**: Immediately after batch assignment
- **Type**: `BATCH_ASSIGNED`
- **Message**: Notifies member about their batch and class assignment

#### B. Due Date Alerts
The system checks due dates and sends alerts based on proximity:

- **7 Days Before**: `CLASS_REMINDER`
  - Message: "Reminder: Your test is due in 7 days. Batch X, Class Y."

- **3 Days Before**: `DUE_DATE_WARNING`
  - Message: "Warning: Your test is due in 3 days. Batch X, Class Y. Please prepare."

- **1 Day Before**: `DUE_DATE_URGENT`
  - Message: "URGENT: Your test is due in less than 1 day! Batch X, Class Y."

## Database Schema

### Batch Assignments Collection (`batch_assignments`)

Stores the assignment of each member to a batch and class:

```typescript
{
  excelId: string
  crewCourseId: string
  batchNumber: number
  classNumber: number
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
}
```

### Alert Notifications Collection (`alert_notifications`)

Stores all alerts sent to members:

```typescript
{
  crewCourseId: string
  batchAssignmentId: string
  memberName: string
  crewId: string
  divisionCode: string
  alertType: 'BATCH_ASSIGNED' | 'CLASS_REMINDER' | 'DUE_DATE_WARNING' | 'DUE_DATE_URGENT'
  message: string
  dueDate: Date
  batchNumber: number
  classNumber: number
  courseName: string
  sentAt: Date
  read: boolean
}
```

## API Endpoints

### 1. Automatic Batch Assignment

**Trigger**: Automatically called after Excel upload

**Endpoint**: `POST /api/upload-excel`

The batch assignment happens automatically when an Excel file is uploaded. The response includes batch assignment results.

### 2. Manual Batch Assignment

**Endpoint**: `POST /api/batch-assignment`

Manually trigger batch assignment for an existing Excel file.

**Request Body**:
```json
{
  "excelId": "uuid-here",
  "station": {
    "id": "station-id",
    "name": "Station Name",
    "code": "STN001"
  },
  "course": {
    "name": "Course Name",
    "timing": "Morning",
    "numberOfBatches": 4,
    "membersPerClass": 25,
    "batchMonths": ["January", "February"],
    "batchYear": 2024
  }
}
```

### 3. Get Batch Assignments

**Endpoint**: `GET /api/batch-assignment`

Query batch assignments by:
- `excelId`: Get all assignments for an Excel file
- `crewId`: Get assignments for a specific crew member
- `divisionCode`: Get assignments for a division

**Example**: `GET /api/batch-assignment?crewId=1456&divisionCode=MAS`

### 4. Get Alerts

**Endpoint**: `GET /api/alerts`

Query alerts by:
- `crewId`: Get alerts for a specific crew member
- `divisionCode`: Get alerts for a division
- `read`: Filter by read status (`true` or `false`)
- `alertType`: Filter by alert type
- `limit`: Limit number of results (default: 50)

**Example**: `GET /api/alerts?crewId=1456&read=false`

### 5. Mark Alert as Read

**Endpoint**: `PATCH /api/alerts`

**Request Body**:
```json
{
  "alertId": "alert-id-here",
  "read": true
}
```

### 6. Scheduler - Check Due Dates and Send Alerts

**Endpoint**: `GET /api/scheduler/check-alerts` or `POST /api/scheduler/check-alerts`

This endpoint should be called periodically (recommended: daily) to check due dates and send alerts.

**Authentication**: Optional - set `SCHEDULER_SECRET_TOKEN` in environment variables and send as `Authorization: Bearer <token>` header.

## Setting Up Automated Alerts

### Option 1: Vercel Cron Jobs

If deploying on Vercel, add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/scheduler/check-alerts",
      "schedule": "0 9 * * *"
    }
  ]
}
```

This runs daily at 9 AM UTC.

### Option 2: External Cron Service

Use services like:
- **cron-job.org**: Free cron job service
- **GitHub Actions**: Schedule workflow
- **AWS EventBridge**: Cloud-based scheduler
- **Google Cloud Scheduler**: Cloud-based scheduler

Configure to call: `https://your-domain.com/api/scheduler/check-alerts`

### Option 3: Server-Side Cron

If running on a server, use `node-cron`:

```javascript
const cron = require('node-cron')
const axios = require('axios')

// Run daily at 9 AM
cron.schedule('0 9 * * *', async () => {
  try {
    await axios.get('http://localhost:3000/api/scheduler/check-alerts', {
      headers: {
        'Authorization': `Bearer ${process.env.SCHEDULER_SECRET_TOKEN}`
      }
    })
  } catch (error) {
    console.error('Scheduler error:', error)
  }
})
```

## Usage Flow

1. **Admin uploads Excel file** with member data and due dates
2. **System automatically**:
   - Parses Excel data
   - Saves to `crew_courses` collection
   - Assigns members to batches/classes
   - Creates initial batch assignment alerts
3. **Scheduler runs daily** (if configured):
   - Checks all due dates
   - Sends appropriate alerts based on proximity
   - Updates alert status
4. **Members receive alerts** via the alerts API
5. **Members can view** their batch/class assignments and alerts

## Frontend Integration

### Display Batch Assignments

```typescript
// Fetch batch assignments for a crew member
const response = await fetch(`/api/batch-assignment?crewId=${crewId}&divisionCode=${divisionCode}`)
const { data } = await response.json()

// Display: Batch X, Class Y
```

### Display Alerts

```typescript
// Fetch unread alerts
const response = await fetch(`/api/alerts?crewId=${crewId}&read=false`)
const { data, unreadCount } = await response.json()

// Display alerts with batch/class information
```

## Environment Variables

Optional (for scheduler authentication):

```env
SCHEDULER_SECRET_TOKEN=your-secret-token-here
```

## Notes

- Batch assignment happens automatically after Excel upload
- Alerts are sent based on due date proximity (7 days, 3 days, 1 day)
- Each member receives only one alert per proximity threshold
- Alerts are stored in the database and can be queried via API
- The system prioritizes members with earlier due dates for earlier batches




