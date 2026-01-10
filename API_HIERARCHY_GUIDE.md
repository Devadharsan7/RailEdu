# API Hierarchy Guide - Division → Designation → Users → Details

## ✅ Updated API Structure

The API now returns simple arrays for each level of the hierarchy, perfect for dropdown/selection UIs.

## 📊 API Endpoints

### 1️⃣ Get All Divisions
**Endpoint:** `GET /api/divisions`

**Returns:** Array of division codes
```json
{
  "success": true,
  "data": ["AJJ", "KPD", "MAS", "MS", "TBM"]
}
```

**Usage:**
```javascript
const response = await fetch('/api/divisions')
const { data } = await response.json()
// data = ["AJJ", "KPD", "MAS", "MS", "TBM"]
```

---

### 2️⃣ Get Designations for a Division
**Endpoint:** `GET /api/divisions/[divisionCode]/designations`

**Example:** `GET /api/divisions/TBM/designations`

**Returns:** Array of designation codes
```json
{
  "success": true,
  "data": ["LPM", "MMAN", "SHT"]
}
```

**Usage:**
```javascript
const response = await fetch('/api/divisions/TBM/designations')
const { data } = await response.json()
// data = ["LPM", "MMAN", "SHT"]
```

---

### 3️⃣ Get Users/Crews for Division + Designation
**Endpoint:** `GET /api/divisions/[divisionCode]/designations/[designationCode]/crews`

**Example:** `GET /api/divisions/TBM/designations/MMAN/crews`

**Returns:** Array of users with crewId and crewName
```json
{
  "success": true,
  "data": [
    { "crewId": "1844", "crewName": "DEVAKUMAR.M" },
    { "crewId": "1845", "crewName": "JOHN.DOE" }
  ],
  "count": 2
}
```

**Usage:**
```javascript
const response = await fetch('/api/divisions/TBM/designations/MMAN/crews')
const { data } = await response.json()
// data = [{ crewId: "1844", crewName: "DEVAKUMAR.M" }, ...]
```

---

### 4️⃣ Get User Details
**Endpoint:** `GET /api/divisions/[divisionCode]/designations/[designationCode]/crews/[crewId]`

**Example:** `GET /api/divisions/TBM/designations/MMAN/crews/1844`

**Returns:** Full user details including all tests
```json
{
  "success": true,
  "data": {
    "crewId": "1844",
    "crewName": "DEVAKUMAR.M",
    "division": "TBM",
    "designation": "MMAN",
    "tests": [
      {
        "testCode": "3PH",
        "dueDate": "2026-02-11T18:30:00.000Z",
        "status": "ACTIVE",
        "reason": "Required for certification",
        "createdAt": "2026-01-10T06:31:03.550Z"
      }
    ]
  }
}
```

**Usage:**
```javascript
const response = await fetch('/api/divisions/TBM/designations/MMAN/crews/1844')
const { data } = await response.json()
// Shows full details: crew name, due date, test code, status, reason
```

## 🎯 UI Flow Example

```javascript
// Step 1: Load divisions
const divisions = await fetch('/api/divisions').then(r => r.json())
// Show dropdown: ["TBM", "MAS", "MS", ...]

// Step 2: User selects "TBM"
const designations = await fetch('/api/divisions/TBM/designations').then(r => r.json())
// Show dropdown: ["LPM", "MMAN", "SHT"]

// Step 3: User selects "MMAN"
const crews = await fetch('/api/divisions/TBM/designations/MMAN/crews').then(r => r.json())
// Show dropdown: [{ crewId: "1844", crewName: "DEVAKUMAR.M" }, ...]

// Step 4: User selects crew "1844"
const details = await fetch('/api/divisions/TBM/designations/MMAN/crews/1844').then(r => r.json())
// Show details: crew name, due date, test code, status, reason
```

## 📋 Schema Updates

### Added `reason` Field
The `crew_courses` collection now includes an optional `reason` field:

```typescript
{
  excelId: string
  division: { code: string }
  crew: { crewId: string, crewName: string }
  designation: { code: string }
  test: { testCode: string, dueDate: Date }
  status: string
  reason?: string  // NEW: Optional reason field
  createdAt: Date
}
```

### Excel Upload
When uploading Excel files, the system will look for a "Reason" column (case-insensitive, also matches: Remarks, Note, Notes, Comment, Comments).

## ✅ Features

- ✅ Simple array responses for easy dropdown population
- ✅ Hierarchical navigation: Division → Designation → Users → Details
- ✅ Efficient queries with proper indexes
- ✅ User details include all test records for that crew
- ✅ Reason field support in schema and upload

## 🚀 Ready to Use

All endpoints are ready and return data in the correct format for your UI hierarchy!

