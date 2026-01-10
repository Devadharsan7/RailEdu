// Database initialization script
// Run this with: node scripts/init-db.js
// Make sure DATABASE_URL is set in your environment or .env file

const { Pool } = require('pg');

// Try to load .env file if it exists (optional)
try {
  require('dotenv').config();
} catch (e) {
  // dotenv not installed, that's okay - use environment variables directly
}

async function initDatabase() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set in environment variables');
    console.log('Please create a .env file with: DATABASE_URL=your_connection_string');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    console.log('🔄 Connecting to database...');
    
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Connected to database');

    // Create divisions table
    console.log('🔄 Creating divisions table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS divisions (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(10) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Divisions table created');

    // Create stations table
    console.log('🔄 Creating stations table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stations (
        id VARCHAR(50) PRIMARY KEY,
        division_id VARCHAR(50) NOT NULL,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(10) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Stations table created');

    // Create users table
    console.log('🔄 Creating users table...');
    await pool.query(`
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
    `);
    console.log('✅ Users table created');

    // Create indexes
    console.log('🔄 Creating indexes...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_crew_id ON users(crew_id)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_station_id ON users(station_id)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_stations_division_id ON stations(division_id)
    `);
    console.log('✅ Indexes created');

    console.log('\n🎉 Database initialized successfully!');
    console.log('You should now see 3 tables in your database:');
    console.log('  - divisions');
    console.log('  - stations');
    console.log('  - users');
    
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initDatabase();

