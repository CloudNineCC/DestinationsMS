import mysql from 'mysql2/promise'

const needsSSL = process.env.DB_HOST &&
  (process.env.DB_HOST.includes('cloudsql') ||
   process.env.DB_HOST.match(/^\d+\.\d+\.\d+\.\d+$/))

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'destinations_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ...(needsSSL && { ssl: { rejectUnauthorized: false } }),
})

export default pool
