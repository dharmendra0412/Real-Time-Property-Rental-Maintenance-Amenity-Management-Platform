require('dotenv').config();
const { Pool } = require('pg');

const databaseUrl = process.env.DATABASE_URL;

let pool = null;
if (databaseUrl) {
  console.log('[Database] Connecting to PostgreSQL Database via pg Pool...');
  const hostMatch = databaseUrl.match(/@([^:/]+)/);
  const dbHost = hostMatch ? hostMatch[1] : undefined;

  pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('localhost') ? false : {
      rejectUnauthorized: false,
      servername: dbHost
    },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000,
    keepAlive: true
  });
  pool.on('error', (err) => {
    console.error('[PostgreSQL Pool Notice]:', err.message);
  });
} else {
  console.error('[Database Fatal]: DATABASE_URL is missing in environment variables!');
}

// Helper to convert standard '?' placeholders to PostgreSQL '$1, $2, ...'
function formatPgQuery(sql) {
  let idx = 0;
  return sql.replace(/\?/g, () => `$${++idx}`);
}

// Automatic retry for serverless wake-up (e.g. Neon compute sleep)
async function executeWithRetry(fn, maxRetries = 2) {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      const isTransient = err.code === 'ECONNRESET' || 
                          err.message?.includes('Connection terminated') ||
                          err.message?.includes('closed unexpectedly');
      if (isTransient && i < maxRetries) {
        await new Promise(r => setTimeout(r, 500 * (i + 1)));
        continue;
      }
      throw err;
    }
  }
}

const db = {
  pool,

  async query(sql, params = []) {
    const pgSql = formatPgQuery(sql);
    return await executeWithRetry(async () => {
      const res = await pool.query(pgSql, params);
      return res.rows;
    });
  },

  async all(sql, params = []) {
    const pgSql = formatPgQuery(sql);
    return await executeWithRetry(async () => {
      const res = await pool.query(pgSql, params);
      return res.rows;
    });
  },

  async get(sql, params = []) {
    const pgSql = formatPgQuery(sql);
    return await executeWithRetry(async () => {
      const res = await pool.query(pgSql, params);
      return res.rows[0] || null;
    });
  },

  async run(sql, params = []) {
    const pgSql = formatPgQuery(sql);
    return await executeWithRetry(async () => {
      return await pool.query(pgSql, params);
    });
  },

  async exec(sql) {
    return await executeWithRetry(async () => {
      return await pool.query(sql);
    });
  },

  async transaction(fn) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const txDb = {
        async all(sql, params = []) {
          const pgSql = formatPgQuery(sql);
          const res = await client.query(pgSql, params);
          return res.rows;
        },
        async get(sql, params = []) {
          const pgSql = formatPgQuery(sql);
          const res = await client.query(pgSql, params);
          return res.rows[0] || null;
        },
        async run(sql, params = []) {
          const pgSql = formatPgQuery(sql);
          return await client.query(pgSql, params);
        }
      };
      const result = await fn(txDb);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
};

async function initializeSchema() {
  if (!pool) {
    console.warn('[Database] Schema initialization skipped: DATABASE_URL is not set.');
    return;
  }
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      full_name VARCHAR(120) NOT NULL,
      email VARCHAR(120) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) CHECK(role IN ('TENANT', 'OWNER', 'STAFF', 'ADMIN')) NOT NULL,
      phone VARCHAR(30),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Properties Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS properties (
      id VARCHAR(64) PRIMARY KEY,
      owner_id VARCHAR(64) NOT NULL,
      name VARCHAR(150) NOT NULL,
      address VARCHAR(255) NOT NULL,
      city VARCHAR(100) NOT NULL,
      state VARCHAR(100) NOT NULL,
      zip_code VARCHAR(20) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 3. Units Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS units (
      id VARCHAR(64) PRIMARY KEY,
      property_id VARCHAR(64) NOT NULL,
      unit_number VARCHAR(50) NOT NULL,
      floor INTEGER NOT NULL,
      status VARCHAR(20) CHECK(status IN ('VACANT', 'OCCUPIED')) DEFAULT 'VACANT',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
    );
  `);

  // 4. Leases Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS leases (
      id VARCHAR(64) PRIMARY KEY,
      unit_id VARCHAR(64) NOT NULL,
      tenant_id VARCHAR(64) NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      rent_amount NUMERIC(10, 2) NOT NULL,
      status VARCHAR(20) CHECK(status IN ('ACTIVE', 'EXPIRED', 'TERMINATED')) DEFAULT 'ACTIVE',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE,
      FOREIGN KEY (tenant_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 5. Amenities Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS amenities (
      id VARCHAR(64) PRIMARY KEY,
      property_id VARCHAR(64) NOT NULL,
      name VARCHAR(150) NOT NULL,
      description TEXT,
      icon VARCHAR(50) DEFAULT 'star',
      max_capacity INTEGER DEFAULT 1,
      opening_time VARCHAR(10) NOT NULL,
      closing_time VARCHAR(10) NOT NULL,
      slot_duration_minutes INTEGER DEFAULT 60,
      is_active INTEGER DEFAULT 1,
      rules TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
    );
  `);

  // 6. Amenity Bookings Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS amenity_bookings (
      id VARCHAR(64) PRIMARY KEY,
      amenity_id VARCHAR(64) NOT NULL,
      user_id VARCHAR(64) NOT NULL,
      booking_date VARCHAR(20) NOT NULL,
      start_time VARCHAR(10) NOT NULL,
      end_time VARCHAR(10) NOT NULL,
      attendees_count INTEGER DEFAULT 1,
      status VARCHAR(20) CHECK(status IN ('CONFIRMED', 'CANCELLED', 'CHECKED_IN', 'COMPLETED')) DEFAULT 'CONFIRMED',
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (amenity_id) REFERENCES amenities(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 7. Maintenance Requests Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS maintenance_requests (
      id VARCHAR(64) PRIMARY KEY,
      property_id VARCHAR(64) NOT NULL,
      unit_id VARCHAR(64) NOT NULL,
      tenant_id VARCHAR(64) NOT NULL,
      assigned_staff_id VARCHAR(64),
      category VARCHAR(30) CHECK(category IN ('PLUMBING', 'ELECTRICAL', 'HVAC', 'APPLIANCE', 'STRUCTURAL', 'SAFETY', 'OTHER')) NOT NULL,
      priority VARCHAR(20) CHECK(priority IN ('LOW', 'MEDIUM', 'HIGH', 'EMERGENCY')) DEFAULT 'MEDIUM',
      title VARCHAR(200) NOT NULL,
      description TEXT NOT NULL,
      photo_url VARCHAR(255),
      status VARCHAR(20) CHECK(status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CLOSED')) DEFAULT 'PENDING',
      scheduled_date TIMESTAMP,
      resolved_at TIMESTAMP,
      resolution_notes TEXT,
      satisfaction_rating INTEGER CHECK(satisfaction_rating BETWEEN 1 AND 5),
      satisfaction_feedback TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
      FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE,
      FOREIGN KEY (tenant_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (assigned_staff_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  // 8. Maintenance Logs Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS maintenance_logs (
      id VARCHAR(64) PRIMARY KEY,
      request_id VARCHAR(64) NOT NULL,
      changed_by_user_id VARCHAR(64) NOT NULL,
      old_status VARCHAR(30),
      new_status VARCHAR(30) NOT NULL,
      action_note TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (request_id) REFERENCES maintenance_requests(id) ON DELETE CASCADE,
      FOREIGN KEY (changed_by_user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  console.log('[Database] PostgreSQL Relational Schema initialized successfully. 100% Pure PostgreSQL Engine. Zero mock data.');
}

initializeSchema().catch(err => console.error('[Database Init Error]:', err));

module.exports = db;
