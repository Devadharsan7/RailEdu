import { Pool } from 'pg'

// Create a connection pool
let pool: Pool | null = null

function getPool(): Pool | null {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      console.warn('DATABASE_URL is not set in environment variables - database operations will be skipped')
      return null
    }
    try {
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false,
        },
        // Connection pool settings
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      })
    } catch (error: any) {
      console.error('Failed to create database pool:', error.message)
      return null
    }
  }
  return pool
}

// Test connection (only in runtime, not during build)
if (typeof window === 'undefined' && process.env.DATABASE_URL) {
  const testPool = getPool()
  if (testPool) {
    testPool.on('connect', () => {
      console.log('Connected to PostgreSQL database')
    })

    testPool.on('error', (err) => {
      console.error('Database connection error:', err.message)
      // Don't exit process, just log the error
    })
  }
}

// Initialize database tables
export async function initDatabase() {
  try {
    const dbPool = getPool()
    if (!dbPool) {
      console.warn('Database pool not available - skipping initialization')
      return
    }
    // Create divisions table
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS divisions (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(10) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create stations table
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS stations (
        id VARCHAR(50) PRIMARY KEY,
        division_id VARCHAR(50) NOT NULL,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(10) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE CASCADE
      )
    `)

    // Create users table
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        email VARCHAR(200),
        phone VARCHAR(50),
        role VARCHAR(50) DEFAULT 'Crew',
        status VARCHAR(20) DEFAULT 'Active',
        crew_id VARCHAR(20),
        division_id VARCHAR(50),
        station_id VARCHAR(50),
        join_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE SET NULL,
        FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE SET NULL
      )
    `)

    // Create indexes for better performance
    await dbPool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_crew_id ON users(crew_id)
    `)
    await dbPool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_station_id ON users(station_id)
    `)
    await dbPool.query(`
      CREATE INDEX IF NOT EXISTS idx_stations_division_id ON stations(division_id)
    `)

    console.log('Database tables initialized successfully')
  } catch (error) {
    console.error('Error initializing database:', error)
    throw error
  }
}

// Division operations
export const dbDivisions = {
  getAll: async () => {
    const dbPool = getPool()
    if (!dbPool) return []
    try {
      const result = await dbPool.query('SELECT * FROM divisions ORDER BY name')
      return result.rows
    } catch (error: any) {
      console.error('Database error getting divisions:', error.message)
      return []
    }
  },
  getById: async (id: string) => {
    const dbPool = getPool()
    if (!dbPool) return undefined
    try {
      const result = await dbPool.query('SELECT * FROM divisions WHERE id = $1', [id])
      return result.rows[0]
    } catch (error: any) {
      console.error('Database error getting division:', error.message)
      return undefined
    }
  },
  create: async (id: string, name: string, code: string) => {
    const dbPool = getPool()
    if (!dbPool) {
      console.warn('Database not available - skipping division creation')
      return
    }
    try {
      await dbPool.query(
        'INSERT INTO divisions (id, name, code) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET name = $2, code = $3',
        [id, name, code]
      )
    } catch (error: any) {
      console.error('Database error creating division:', error.message)
      throw error
    }
  },
}

// Station operations
export const dbStations = {
  getByDivision: async (divisionId: string) => {
    const dbPool = getPool()
    if (!dbPool) return []
    try {
      const result = await dbPool.query(
        'SELECT * FROM stations WHERE division_id = $1 ORDER BY name',
        [divisionId]
      )
      return result.rows
    } catch (error: any) {
      console.error('Database error getting stations:', error.message)
      return []
    }
  },
  getByCode: async (divisionId: string, code: string) => {
    const dbPool = getPool()
    if (!dbPool) return undefined
    try {
      const result = await dbPool.query(
        'SELECT * FROM stations WHERE division_id = $1 AND code = $2',
        [divisionId, code]
      )
      return result.rows[0]
    } catch (error: any) {
      console.error('Database error getting station:', error.message)
      return undefined
    }
  },
  create: async (id: string, divisionId: string, name: string, code: string) => {
    const dbPool = getPool()
    if (!dbPool) {
      console.warn('Database not available - skipping station creation')
      return
    }
    try {
      await dbPool.query(
        'INSERT INTO stations (id, division_id, name, code) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO UPDATE SET name = $3, code = $4',
        [id, divisionId, name, code]
      )
    } catch (error: any) {
      console.error('Database error creating station:', error.message)
      throw error
    }
  },
}

// User operations
export const dbUsers = {
  getByStation: async (stationId: string) => {
    const dbPool = getPool()
    if (!dbPool) return []
    try {
      const result = await dbPool.query(
        'SELECT * FROM users WHERE station_id = $1 ORDER BY name',
        [stationId]
      )
      return result.rows
    } catch (error: any) {
      console.error('Database error getting users:', error.message)
      return []
    }
  },
  create: async (user: {
    id: string
    name: string
    email?: string
    phone?: string
    role?: string
    status?: string
    crewId?: string
    divisionId?: string
    stationId?: string
    joinDate?: string
  }) => {
    const dbPool = getPool()
    if (!dbPool) {
      console.warn('Database not available - skipping user creation')
      return
    }
    try {
      await dbPool.query(
      `INSERT INTO users (id, name, email, phone, role, status, crew_id, division_id, station_id, join_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO UPDATE SET
         name = $2, email = $3, phone = $4, role = $5, status = $6,
         crew_id = $7, division_id = $8, station_id = $9, join_date = $10`,
      [
        user.id,
        user.name,
        user.email || null,
        user.phone || null,
        user.role || 'Crew',
        user.status || 'Active',
        user.crewId || null,
        user.divisionId || null,
        user.stationId || null,
        user.joinDate || null,
      ]
    )
    } catch (error: any) {
      console.error('Database error creating user:', error.message)
      throw error
    }
  },
  createBatch: async (users: Array<{
    id: string
    name: string
    email?: string
    phone?: string
    role?: string
    status?: string
    crewId?: string
    divisionId?: string
    stationId?: string
    joinDate?: string
  }>) => {
    const dbPool = getPool()
    if (!dbPool) {
      console.warn('Database not available - skipping batch user creation')
      return
    }
    const client = await dbPool.connect()
    try {
      await client.query('BEGIN')
      
      for (const user of users) {
        await client.query(
          `INSERT INTO users (id, name, email, phone, role, status, crew_id, division_id, station_id, join_date)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (id) DO UPDATE SET
             name = $2, email = $3, phone = $4, role = $5, status = $6,
             crew_id = $7, division_id = $8, station_id = $9, join_date = $10`,
          [
            user.id,
            user.name,
            user.email || null,
            user.phone || null,
            user.role || 'Crew',
            user.status || 'Active',
            user.crewId || null,
            user.divisionId || null,
            user.stationId || null,
            user.joinDate || null,
          ]
        )
      }
      
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  },
}

export default getPool

