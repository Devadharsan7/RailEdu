# MongoDB Schema Update - Division Parsing

## ✅ Implementation Complete

The MongoDB schema has been updated to properly separate division codes from crew IDs, supporting the UI flow: **Division → Designation → Users**.

## 📋 Updated Schema

### Collection: `excel_files`
Stores uploaded Excel metadata (unchanged).

### Collection: `crew_courses`
Stores parsed Excel rows with separated division and crew ID.

**Updated Schema:**
```typescript
{
  excelId: String (indexed),
  division: {
    code: String (indexed)  // e.g., "MAS", "MS" - extracted from crewId prefix
  },
  crew: {
    crewId: String (indexed),    // numeric part only (e.g., "1456" from "MAS1456")
    crewName: String
  },
  designation: {
    code: String (indexed)  // e.g., LPM, SHT, MMAN
  },
  test: {
    testCode: String,
    dueDate: Date
  },
  status: String,
  createdAt: Date
}
```

## 🔄 Crew ID Parsing Logic

The system now automatically parses crew IDs to extract division codes:

**Examples:**
- `MAS1456` → `division.code: "MAS"`, `crew.crewId: "1456"`
- `MS3034` → `division.code: "MS"`, `crew.crewId: "3034"`
- `TBM1844` → `division.code: "TBM"`, `crew.crewId: "1844"`
- `AJJ1459` → `division.code: "AJJ"`, `crew.crewId: "1459"`

**Parser Logic:**
1. Matches known division codes (MAS, MS, TBM, etc.)
2. Extracts numeric part as crewId
3. Falls back to regex pattern matching if needed
4. Defaults to "UNKNOWN" division if parsing fails

## 📊 API Routes for UI Flow

### 1️⃣ Get All Divisions
**Endpoint:** `GET /api/divisions`

Returns distinct division codes:
```json
{
  "success": true,
  "data": [
    { "id": "1", "name": "MAS", "code": "MAS" },
    { "id": "2", "name": "MS", "code": "MS" }
  ]
}
```

### 2️⃣ Get Designations for a Division
**Endpoint:** `GET /api/divisions/[divisionCode]/designations`

Example: `GET /api/divisions/MAS/designations`

Returns distinct designation codes for the division:
```json
{
  "success": true,
  "data": [
    { "code": "LPM", "name": "LPM" },
    { "code": "SHT", "name": "SHT" },
    { "code": "MMAN", "name": "MMAN" }
  ]
}
```

### 3️⃣ Get Crews for Division + Designation
**Endpoint:** `GET /api/divisions/[divisionCode]/designations/[designationCode]/crews`

Example: `GET /api/divisions/MAS/designations/LPM/crews`

Returns unique crews (crewId + crewName):
```json
{
  "success": true,
  "data": [
    { "crewId": "1456", "crewName": "John Doe" },
    { "crewId": "3034", "crewName": "Jane Smith" }
  ],
  "count": 2
}
```

## 🔍 Indexes for Efficient Queries

The schema includes optimized indexes:

1. **Single field indexes:**
   - `excelId`
   - `division.code`
   - `crew.crewId`
   - `designation.code`

2. **Compound indexes:**
   - `{ division.code: 1, designation.code: 1 }` - For getting designations
   - `{ division.code: 1, designation.code: 1, crew.crewId: 1 }` - For getting crews
   - `{ division.code: 1, crew.crewId: 1 }` - For division-wide queries
   - `{ excelId: 1, division.code: 1 }` - For Excel-specific queries

## ✅ Features

- ✅ Automatic division code extraction from crewId
- ✅ Clean separation of division, designation, and crew
- ✅ Efficient queries without complex aggregations
- ✅ Index-friendly structure
- ✅ Re-upload logic (reuses excelId for same file name)
- ✅ One document = one crew + one designation + one test

## 🚀 Usage

1. **Upload Excel File:**
   - Excel should have columns: Crew ID (e.g., "MAS1456"), Crew Name, Designation Code, etc.
   - System automatically parses division code from Crew ID
   - Data is saved with separated division and crewId

2. **Query Divisions:**
   ```javascript
   const response = await fetch('/api/divisions')
   const { data } = await response.json()
   // Returns all unique divisions
   ```

3. **Query Designations:**
   ```javascript
   const response = await fetch('/api/divisions/MAS/designations')
   const { data } = await response.json()
   // Returns all designations for MAS division
   ```

4. **Query Crews:**
   ```javascript
   const response = await fetch('/api/divisions/MAS/designations/LPM/crews')
   const { data } = await response.json()
   // Returns all crews in MAS division with LPM designation
   ```

## 📝 Notes

- Division codes are automatically extracted from crewId prefix
- MAS is NOT mixed inside crewId field - they are stored separately
- All queries use indexed fields for optimal performance
- The UI flow (Division → Designation → Users) is fully supported




