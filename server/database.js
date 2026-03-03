import sqlite3 from 'sqlite3';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database configuration
const DB_TYPE = process.env.DB_TYPE || 'sqlite';
const dbPath = join(__dirname, '..', process.env.DB_PATH || 'database.sqlite');

let db; // SQLite connection
let pool; // MySQL connection pool

// Initialize based on DB_TYPE
async function initDatabase() {
  if (DB_TYPE === 'mysql') {
    await initMySQL();
  } else {
    initSQLite();
  }
}

// SQLite initialization
function initSQLite() {
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening SQLite database:', err.message);
    } else {
      console.log('Connected to SQLite database');
      initializeTables();
    }
  });
}

// MySQL initialization
async function initMySQL() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'votaciones',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };

  try {
    // First connect without database to create it if needed
    const tempPool = mysql.createPool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      waitForConnections: true,
      connectionLimit: 2
    });

    await tempPool.query('CREATE DATABASE IF NOT EXISTS ' + config.database);
    await tempPool.end();

    // Now connect to the actual database
    pool = mysql.createPool(config);
    console.log('Connected to MySQL database');
    
    initializeTables();
  } catch (err) {
    console.error('Error connecting to MySQL:', err.message);
    throw err;
  }
}

// Initialize tables (works for both SQLite and MySQL)
function initializeTables() {
  if (DB_TYPE === 'mysql') {
    initMySQLTables();
  } else {
    initSQLiteTables();
  }
}

function initSQLiteTables() {
  // Create users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create voters table
  db.run(`
    CREATE TABLE IF NOT EXISTS voters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cedula TEXT UNIQUE NOT NULL,
      nombre TEXT NOT NULL,
      mesa TEXT NOT NULL,
      referidor TEXT,
      voted INTEGER DEFAULT 0,
      voted_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating tables:', err.message);
    } else {
      console.log('SQLite tables initialized');
      createDefaultAdmin();
    }
  });
}

async function initMySQLTables() {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Create voters table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS voters (
        id INT AUTO_INCREMENT PRIMARY KEY,
        cedula VARCHAR(255) UNIQUE NOT NULL,
        nombre VARCHAR(255) NOT NULL,
        mesa VARCHAR(50) NOT NULL,
        referidor VARCHAR(255),
        voted TINYINT DEFAULT 0,
        voted_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    console.log('MySQL tables initialized');
    createDefaultAdmin();
  } catch (err) {
    console.error('Error creating MySQL tables:', err.message);
  }
}

function createDefaultAdmin() {
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'votacion2024';
  
  if (DB_TYPE === 'mysql') {
    createMySQLAdmin(adminUsername, adminPassword);
  } else {
    createSQLiteAdmin(adminUsername, adminPassword);
  }
}

function createSQLiteAdmin(adminUsername, adminPassword) {
  db.get('SELECT id, password_hash FROM users WHERE username = ?', [adminUsername], (err, row) => {
    if (err) {
      console.error('Error checking for admin:', err.message);
      return;
    }
    
    if (!row) {
      const hashedPassword = bcrypt.hashSync(adminPassword, 10);
      db.run(
        'INSERT INTO users (username, password_hash) VALUES (?, ?)',
        [adminUsername, hashedPassword],
        (err) => {
          if (err) {
            console.error('Error creating admin user:', err.message);
          } else {
            console.log('SQLite admin user created');
          }
        }
      );
    } else {
      const hashedEnvPassword = bcrypt.hashSync(adminPassword, 10);
      if (row.password_hash !== hashedEnvPassword) {
        db.run(
          'UPDATE users SET password_hash = ? WHERE username = ?',
          [hashedEnvPassword, adminUsername],
          (err) => {
            if (err) {
              console.error('Error updating admin password:', err.message);
            } else {
              console.log('SQLite admin password updated from environment variable');
            }
          }
        );
      }
    }
  });
}

async function createMySQLAdmin(adminUsername, adminPassword) {
  try {
    const [rows] = await pool.query('SELECT id, password_hash FROM users WHERE username = ?', [adminUsername]);
    
    if (rows.length === 0) {
      const hashedPassword = bcrypt.hashSync(adminPassword, 10);
      await pool.query(
        'INSERT INTO users (username, password_hash) VALUES (?, ?)',
        [adminUsername, hashedPassword]
      );
      console.log('MySQL admin user created');
    } else {
      const hashedEnvPassword = bcrypt.hashSync(adminPassword, 10);
      if (rows[0].password_hash !== hashedEnvPassword) {
        await pool.query(
          'UPDATE users SET password_hash = ? WHERE username = ?',
          [hashedEnvPassword, adminUsername]
        );
        console.log('MySQL admin password updated from environment variable');
      }
    }
  } catch (err) {
    console.error('Error managing MySQL admin:', err.message);
  }
}

// Utility functions for database operations
// These work transparently for both SQLite and MySQL

export function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    if (DB_TYPE === 'mysql') {
      pool.query(sql, params)
        .then(([result]) => {
          resolve({ lastID: result.insertId, changes: result.affectedRows });
        })
        .catch(reject);
    } else {
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    }
  });
}

export function getOne(sql, params = []) {
  return new Promise((resolve, reject) => {
    if (DB_TYPE === 'mysql') {
      pool.query(sql, params)
        .then(([rows]) => {
          resolve(rows[0] || null);
        })
        .catch(reject);
    } else {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    }
  });
}

export function getAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    if (DB_TYPE === 'mysql') {
      pool.query(sql, params)
        .then(([rows]) => {
          resolve(rows);
        })
        .catch(reject);
    } else {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    }
  });
}

// Export for initialization
export default { initDatabase };
