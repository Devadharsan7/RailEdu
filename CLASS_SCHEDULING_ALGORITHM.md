# Class Scheduling Algorithm

## Overview

This algorithm automatically schedules classes for users based on their batch assignments, ensuring:
- Users complete all classes before their due dates
- No time conflicts for users from the same station (they need to work at their station)
- All classes for a user are scheduled in one continuous session
- Users receive alerts about their scheduled classes

## How It Works

### 1. Data Collection
- Fetches all batch assignments where users have been assigned to batches/classes
- Groups assignments by user (crewId + station)
- Collects all classes that each user needs to complete

### 2. Scheduling Strategy

#### User Grouping
- Groups all classes for each user together
- Users from the same station cannot have overlapping schedules
- Sorts users by earliest due date (urgent first)

#### Time Slot Selection
- Finds optimal schedule time that:
  - Is at least 1 day in the future (gives notice)
  - Is before the due date with buffer (default: 7 days before)
  - Falls within working hours (default: 9 AM - 5 PM)
  - Only on weekdays (Monday-Friday by default)
  - Does NOT conflict with other users from the same station

#### Session Creation
- Groups all user's classes into one continuous session
- Each class has duration (default: 60 minutes)
- Breaks between classes (default: 15 minutes)
- Total session duration = (number of classes × duration) + (breaks)

### 3. Conflict Prevention

The algorithm prevents conflicts by:
1. Checking existing schedules from database
2. For each new schedule, verifying no time overlap with same-station users
3. If conflict found, tries next available time slot
4. Continues until finds available slot or exhausts search (30 days)

### 4. Alert System

After scheduling, the system:
- Creates `CLASS_SCHEDULED` alert with full schedule details
- Creates individual `CLASS_REMINDER` alerts for each class
- Alerts include:
  - Date and time
  - List of all classes in the session
  - Instruction to complete all classes before returning to station work

## API Usage

### Schedule Classes for All Users

**Endpoint:** `POST /api/schedule-classes`

**Request Body (optional configuration):**
```json
{
  "classDurationMinutes": 60,      // Duration per class (default: 60)
  "breakBetweenClasses": 15,       // Break between classes (default: 15)
  "bufferDaysBeforeDue": 7,        // Schedule this many days before due (default: 7)
  "workingHours": {
    "start": 9,                     // Start hour (0-23) (default: 9)
    "end": 17                       // End hour (0-23) (default: 17)
  },
  "daysOfWeek": [1, 2, 3, 4, 5]    // Allowed days (0=Sun, 1=Mon, etc.) (default: Mon-Fri)
}
```

**Response:**
```json
{
  "success": true,
  "message": "Scheduled 25 users, 2 failed",
  "data": {
    "success": true,
    "scheduled": 25,
    "failed": 2,
    "schedules": [...],
    "errors": ["Failed to schedule classes for User X - No available time slot found"]
  }
}
```

### Get Schedules

**Endpoint:** `GET /api/schedule-classes`

**Query Parameters:**
- `crewId`: Get schedule for specific user
- `stationCode`: Get all schedules for a station
- `divisionCode`: Get all schedules for a division
- `status`: Filter by status (`scheduled`, `in-progress`, `completed`, `cancelled`)
- `startDate`: Get schedules from this date
- `endDate`: Get schedules until this date

**Example:**
```
GET /api/schedule-classes?stationCode=MAS&status=scheduled
GET /api/schedule-classes?crewId=1456
GET /api/schedule-classes?startDate=2024-01-01&endDate=2024-01-31
```

### Update Schedule Status

**Endpoint:** `PATCH /api/schedule-classes`

**Request Body:**
```json
{
  "scheduleId": "MAS-1456-1234567890",
  "status": "completed"  // or "in-progress", "cancelled"
}
```

## Configuration Defaults

- **Class Duration:** 60 minutes
- **Break Between Classes:** 15 minutes
- **Buffer Before Due Date:** 7 days
- **Working Hours:** 9 AM - 5 PM
- **Allowed Days:** Monday to Friday (weekdays)

## Key Features

### ✅ Station Conflict Prevention
- Users from the same station never have overlapping schedules
- Ensures station operations continue normally

### ✅ Single Session Completion
- All user's classes are grouped into one continuous session
- User completes all classes before returning to work
- Prevents multiple interruptions to station work

### ✅ Due Date Compliance
- Classes scheduled well before due dates (7 days buffer)
- Urgent cases (earlier due dates) scheduled first
- Ensures users have time to complete classes

### ✅ Flexible Scheduling
- Configurable working hours
- Configurable allowed days
- Adjustable class duration and breaks
- Buffer days before due date

## Workflow

1. **Admin assigns batches** → Users are assigned to batches and classes
2. **Run scheduling algorithm** → `POST /api/schedule-classes`
3. **Algorithm schedules** → Finds optimal times, prevents conflicts
4. **Alerts sent** → Users receive notifications about their scheduled classes
5. **Users attend** → Complete all classes in one session
6. **Status updated** → Mark as completed after attendance

## Example Scenario

**User:** John Doe (Crew ID: 1456, Station: MAS)
**Classes Assigned:**
- Course A, Batch 1, Class 1 (Due: 2024-02-15)
- Course B, Batch 2, Class 3 (Due: 2024-02-20)
- Course C, Batch 1, Class 2 (Due: 2024-02-18)

**Algorithm Process:**
1. Groups all 3 classes for John
2. Finds earliest due date: 2024-02-15
3. Calculates session duration: 3 classes × 60 min + 2 breaks × 15 min = 210 minutes (3.5 hours)
4. Finds available slot before 2024-02-08 (7 days buffer)
5. Checks no other MAS station user is scheduled at that time
6. Schedules: 2024-02-05, 9:00 AM - 12:30 PM
7. Sends alert to John with all details

## Integration with Existing System

- Works with existing `BatchAssignment` system
- Uses `CrewCourse` data for user and test information
- Creates `AlertNotification` entries for user alerts
- Stores schedules in `ClassSchedule` collection
- Integrates with course page for viewing schedules



