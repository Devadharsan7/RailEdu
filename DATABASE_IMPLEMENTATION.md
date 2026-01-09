# Database Implementation for Excel Upload

## ✅ Implementation Complete

The Excel upload functionality has been successfully integrated with PostgreSQL database. All uploaded member data is now saved to the database instead of localStorage.

## 📋 What Was Implemented

### 1. **Database Connection Setup** (`lib/db.ts`)
   - PostgreSQL connection pool using `pg` library
   - Connection string from `.env` file (DATABASE_URL)
   - Automatic table initialization
   - Error handling and connection management

### 2. **Database Schema**
   Three main tables created:
   
   - **`divisions`** - Stores railway divisions
     - `id` (VARCHAR) - Primary key
     - `name` (VARCHAR) - Division name
     - `code` (VARCHAR) - Division code (e.g., MAS, MDU)
     - `created_at` (TIMESTAMP)
   
   - **`stations`** - Stores railway stations
     - `id` (VARCHAR) - Primary key
     - `division_id` (VARCHAR) - Foreign key to divisions
     - `name` (VARCHAR) - Station name
     - `code` (VARCHAR) - Station code (e.g., MAS, MS, AVD)
     - `created_at` (TIMESTAMP)
   
   - **`users`** - Stores crew members/users
     - `id` (VARCHAR) - Primary key
     - `name` (VARCHAR) - Member name
     - `email` (VARCHAR) - Email address
     - `phone` (VARCHAR) - Phone number
     - `role` (VARCHAR) - Role/Designation
     - `status` (VARCHAR) - Active/Inactive
     - `crew_id` (VARCHAR) - Crew ID (station code)
     - `division_id` (VARCHAR) - Foreign key to divisions
     - `station_id` (VARCHAR) - Foreign key to stations
     - `join_date` (DATE) - Join date
     - `created_at` (TIMESTAMP)

### 3. **API Routes**

   - **`/api/upload-excel`** (POST)
     - Processes Excel file uploads
     - Parses member data by Crew ID
     - Automatically creates divisions and stations if they don't exist
     - Saves all users to database in batch transaction
     - Returns success response with statistics
   
   - **`/api/divisions`** (GET)
     - Fetches all divisions with their stations and users
     - Returns hierarchical data structure
   
   - **`/api/init-db`** (GET)
     - Initializes database tables (can be called manually if needed)

### 4. **Updated Components**

   - **`ExcelUploadModal.tsx`**
     - Now sends data to API which saves to database
     - Still maintains localStorage backup for offline support
   
   - **`app/users/page.tsx`**
     - Fetches data from database via `/api/divisions` endpoint
     - Falls back to localStorage if database is unavailable

## 🔄 How It Works

1. **Admin uploads Excel file:**
   - Selects a division from dropdown
   - Uploads Excel file with member data
   - File is sent to `/api/upload-excel` endpoint

2. **Backend processing:**
   - Excel file is parsed using `xlsx` library
   - Members are grouped by Crew ID (station code)
   - Division is created/updated in database
   - Stations are created/updated for each unique Crew ID
   - All users are saved to database in a single transaction

3. **Data organization:**
   - Members are automatically separated by their Crew ID
   - Each Crew ID becomes a station
   - Stations are linked to the selected division
   - Users are linked to both division and station

4. **Viewing data:**
   - Users page fetches data from database
   - Shows divisions → stations → users hierarchy
   - All data is loaded dynamically from PostgreSQL

## 📊 Database Operations

### Division Operations
- `dbDivisions.getAll()` - Get all divisions
- `dbDivisions.getById(id)` - Get division by ID
- `dbDivisions.create(id, name, code)` - Create/update division

### Station Operations
- `dbStations.getByDivision(divisionId)` - Get all stations in a division
- `dbStations.getByCode(divisionId, code)` - Get station by code
- `dbStations.create(id, divisionId, name, code)` - Create/update station

### User Operations
- `dbUsers.getByStation(stationId)` - Get all users in a station
- `dbUsers.create(user)` - Create/update single user
- `dbUsers.createBatch(users[])` - Create/update multiple users in transaction

## 🔐 Database Connection

The database connection string is stored in `.env` file:
```
DATABASE_URL=postgresql://neondb_owner:npg_B1Lq6bsZNIax@ep-lingering-sun-ahxjh1zp-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

## ✅ Features

- ✅ Automatic table creation on first use
- ✅ Batch insert for better performance
- ✅ Transaction support (all-or-nothing)
- ✅ Duplicate handling (ON CONFLICT UPDATE)
- ✅ Foreign key relationships
- ✅ Indexes for fast queries
- ✅ Error handling and logging
- ✅ Fallback to localStorage if database unavailable

## 🚀 Usage

1. **First Time Setup:**
   - Database tables are automatically created when you first upload an Excel file
   - Or manually call `/api/init-db` to initialize tables

2. **Upload Excel File:**
   - Go to Admin Dashboard
   - Click "Add" button
   - Select a division
   - Upload Excel file with columns: Crew ID, Name, Email, Phone, Role, Status
   - Data is automatically saved to database

3. **View Users:**
   - Go to Users page
   - Click on a division to see stations
   - Click on a station to see users
   - All data is loaded from database

## 📝 Notes

- The application maintains backward compatibility with localStorage
- If database connection fails, the app falls back to localStorage
- All database operations use connection pooling for efficiency
- Database errors are logged but don't crash the application

## 🎯 Response Format

When Excel is uploaded successfully, the API returns:

```json
{
  "success": true,
  "message": "Successfully parsed and saved X members to database",
  "data": {
    "divisionId": "1",
    "divisionName": "Chennai",
    "totalMembers": 150,
    "stationsCount": 5,
    "stations": {
      "MAS": {
        "name": "Chennai Central",
        "code": "MAS",
        "users": [...]
      },
      ...
    },
    "savedToDatabase": true
  }
}
```

---

**Status:** ✅ Complete and Ready for Use

