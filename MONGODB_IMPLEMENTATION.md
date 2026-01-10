# MongoDB Implementation

## ✅ Implementation Complete

The application has been migrated from PostgreSQL to MongoDB. All Excel upload functionality now uses MongoDB collections.

## 📋 Database Structure

### MongoDB Connection
- **Connection String**: Set via `MONGODB_URI` environment variable
- **Default**: `mongodb+srv://devadharsanmani_db_user:DaiHWJEZc4ivPTrb@cluster0.1og6aqa.mongodb.net/railedu?appName=Cluster0`
- **Database Name**: `railedu`

### Collections

#### 1. `excel_files` Collection
Stores metadata of each uploaded Excel file.

**Schema:**
```typescript
{
  excelId: string (unique, indexed)
  excelName: string (indexed)
  uploadedAt: Date
  uploadedBy: string
  totalRecords: number
  status: 'ACTIVE' | 'INACTIVE' (indexed)
}
```

#### 2. `crew_courses` Collection
Stores each row from the Excel as a separate document (one document = one crew + one designation + one test).

**Schema:**
```typescript
{
  excelId: string (indexed)
  crew: {
    crewId: string (indexed)
    crewName: string
  }
  designation: {
    code: string // e.g., LPM, SHT, MMAN
  }
  test: {
    testCode: string
    dueDate: Date
    status: string
  }
  createdAt: Date
}
```

**Indexes:**
- `excelId` (single field)
- `crew.crewId` (single field)
- `excelId + crew.crewId` (compound)
- `crew.crewId + designation.code` (compound)
- `test.dueDate + test.status` (compound)

## 🔄 Excel Re-upload Logic (CRITICAL)

When a user uploads an Excel file:

1. **Check by `excelName`**: Query `excel_files` collection by `excelName`
2. **If exists**: Reuse the existing `excelId`
3. **If not exists**: Generate a new `excelId` (UUID v4)
4. **After resolving `excelId`**:
   - Parse Excel rows
   - If re-uploading: Delete all existing `crew_courses` documents with that `excelId`
   - Insert new `crew_courses` documents using the resolved `excelId`
   - Update `excel_files` document with new metadata

## 📊 API Routes

### `/api/upload-excel` (POST)
- Uploads Excel file
- Implements re-upload logic
- Parses Excel and saves to MongoDB
- Returns success response with statistics

**Request:**
- `file`: Excel file (multipart/form-data)
- `uploadedBy`: User identifier (optional, defaults to 'admin')

**Response:**
```json
{
  "success": true,
  "message": "Successfully uploaded...",
  "data": {
    "excelId": "uuid",
    "excelName": "file.xlsx",
    "totalRecords": 100,
    "isReupload": false,
    "summary": {
      "totalRows": 100,
      "successfulRows": 95,
      "errorRows": 0,
      "warningRows": 5
    }
  }
}
```

### `/api/excel-files` (GET)
- Fetches all active Excel files
- Returns list of `excel_files` documents

### `/api/crew-courses` (GET)
- Fetches crew courses with optional filters
- Query parameters:
  - `excelId`: Filter by Excel file ID
  - `crewId`: Filter by crew ID
  - `designationCode`: Filter by designation code
  - `testStatus`: Filter by test status

### `/api/divisions` (GET)
- Transforms MongoDB data to match frontend expectations
- Groups crew courses by crewId (as stations)
- Returns divisions/stations/users structure

### `/api/init-db` (GET)
- Tests MongoDB connection
- Creates indexes if needed
- Returns connection status

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
MONGODB_URI=mongodb+srv://devadharsanmani_db_user:DaiHWJEZc4ivPTrb@cluster0.1og6aqa.mongodb.net/railedu?appName=Cluster0
```

## ✅ Features

- ✅ Automatic collection creation (MongoDB creates collections on first insert)
- ✅ Automatic index creation (via Mongoose schemas)
- ✅ Re-upload logic (reuses excelId for same file name)
- ✅ Batch insert for performance
- ✅ Error handling and logging
- ✅ Scalable schema design
- ✅ Dashboard-ready data structure

## 🚀 Usage

1. **First Time Setup:**
   - Ensure `MONGODB_URI` is set in `.env` file
   - Call `/api/init-db` to test connection and create indexes

2. **Upload Excel File:**
   - Go to Admin Dashboard
   - Click "Add" button
   - Upload Excel file with columns:
     - Crew ID (required)
     - Crew Name (required)
     - Designation Code (optional, defaults to 'UNKNOWN')
     - Test Code (optional, auto-generated if missing)
     - Due Date (optional, defaults to today)
     - Test Status (optional, defaults to 'PENDING')
   - Data is automatically saved to MongoDB

3. **Re-upload Same File:**
   - Upload Excel file with the same name
   - System automatically detects existing file
   - Reuses existing `excelId`
   - Deletes old `crew_courses` and inserts new ones
   - Updates `excel_files` metadata

4. **View Data:**
   - Go to Users page (`/users`)
   - Data is loaded from MongoDB via `/api/divisions`
   - Crew courses are grouped by crewId (stations)

## 📝 Excel File Format

Expected columns (case-insensitive, flexible matching):
- **Crew ID** / Crew ID / Station Code / Code (required)
- **Crew Name** / Name / Member Name (required)
- **Designation** / Designation Code / Role (optional)
- **Test Code** / Test Code / Course Code (optional)
- **Due Date** / Due Date / Deadline (optional)
- **Test Status** / Status / Test Status (optional)

## 🔍 MongoDB Best Practices

- ✅ One document = one crew + one designation + one test (no nesting)
- ✅ Proper indexing on frequently queried fields
- ✅ Compound indexes for complex queries
- ✅ Connection pooling via Mongoose
- ✅ Error handling and graceful degradation

## 📦 Dependencies

- `mongoose`: MongoDB ODM
- `uuid`: Generate unique Excel IDs
- `xlsx`: Parse Excel files

