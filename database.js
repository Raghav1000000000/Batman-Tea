const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

// Initialize SQLite database
const dbPath = path.join(__dirname, process.env.DB_NAME || 'batman-tea.db');
const db = new Database(dbPath);

// Enable Write-Ahead Logging for better performance
db.pragma('journal_mode = WAL');

function initializeDatabase() {
  try {
    // Create bookings table
    db.exec(`
      CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        location TEXT NOT NULL,
        customLocation TEXT,
        notes TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        eta TEXT,
        createdAt TEXT NOT NULL
      )
    `);

    // Create notifications table
    db.exec(`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        message TEXT NOT NULL,
        location TEXT,
        createdAt TEXT NOT NULL
      )
    `);

    // Create settings table
    db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);

    // Create auth_tokens table
    db.exec(`
      CREATE TABLE IF NOT EXISTS auth_tokens (
        token TEXT PRIMARY KEY,
        createdAt TEXT NOT NULL,
        expiresAt TEXT NOT NULL
      )
    `);

    // Initialize default password if not exists
    const adminPassword = db.prepare('SELECT value FROM settings WHERE key = ?').get('adminPassword');
    if (!adminPassword) {
      const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'teatime';
      const hashedPassword = hashPassword(defaultPassword);
      db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('adminPassword', hashedPassword);
    }

    // Initialize shop status if not exists
    const shopStatus = db.prepare('SELECT value FROM settings WHERE key = ?').get('shopStatus');
    if (!shopStatus) {
      db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('shopStatus', JSON.stringify({ isOpen: true }));
    }

    // Create indexes for better query performance
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_bookings_phone ON bookings(phone);
      CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
      CREATE INDEX IF NOT EXISTS idx_bookings_created ON bookings(createdAt DESC);
      CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(createdAt DESC);
    `);

    console.log('✅ SQLite database initialized successfully!');
    console.log('📁 Database location:', dbPath);
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    throw error;
  }
}

// Booking operations
function getAllBookings() {
  try {
    const stmt = db.prepare('SELECT * FROM bookings ORDER BY createdAt DESC');
    return stmt.all();
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return [];
  }
}

function createBooking(bookingData) {
  try {
    const booking = {
      id: Date.now().toString(),
      name: bookingData.name,
      phone: bookingData.phone,
      location: bookingData.location,
      customLocation: bookingData.customLocation || null,
      notes: bookingData.notes || null,
      status: 'pending',
      eta: '',
      createdAt: new Date().toISOString()
    };

    const stmt = db.prepare(`
      INSERT INTO bookings (id, name, phone, location, customLocation, notes, status, eta, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      booking.id,
      booking.name,
      booking.phone,
      booking.location,
      booking.customLocation,
      booking.notes,
      booking.status,
      booking.eta,
      booking.createdAt
    );

    return booking;
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
}

function updateBooking(id, phone, updates) {
  try {
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);
    if (!booking) {
      return null;
    }

    const updateFields = [];
    const values = [];

    if (updates.status !== undefined) {
      updateFields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.eta !== undefined) {
      updateFields.push('eta = ?');
      values.push(updates.eta);
    }

    if (updateFields.length > 0) {
      values.push(id);
      const stmt = db.prepare(`UPDATE bookings SET ${updateFields.join(', ')} WHERE id = ?`);
      stmt.run(...values);
    }

    return db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);
  } catch (error) {
    console.error('Error updating booking:', error);
    return null;
  }
}

function deleteBooking(id, phone) {
  try {
    const stmt = db.prepare('DELETE FROM bookings WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  } catch (error) {
    console.error('Error deleting booking:', error);
    return false;
  }
}

// Notification operations
function getNotifications(limit = 20) {
  try {
    const stmt = db.prepare('SELECT * FROM notifications ORDER BY createdAt DESC LIMIT ?');
    return stmt.all(limit);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}

function createNotification(notificationData) {
  try {
    const notification = {
      id: Date.now().toString(),
      message: notificationData.message,
      location: notificationData.location || null,
      createdAt: new Date().toISOString()
    };

    const stmt = db.prepare(`
      INSERT INTO notifications (id, message, location, createdAt)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(
      notification.id,
      notification.message,
      notification.location,
      notification.createdAt
    );

    // Keep only last 50 notifications
    const deleteStmt = db.prepare(`
      DELETE FROM notifications WHERE id NOT IN (
        SELECT id FROM notifications ORDER BY createdAt DESC LIMIT 50
      )
    `);
    deleteStmt.run();

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

// Shop status operations
function getShopStatus() {
  try {
    const result = db.prepare('SELECT value FROM settings WHERE key = ?').get('shopStatus');
    if (result) {
      return JSON.parse(result.value);
    }
    return { isOpen: true };
  } catch (error) {
    console.error('Error fetching shop status:', error);
    return { isOpen: true };
  }
}

function updateShopStatus(isOpen) {
  try {
    const status = { isOpen };
    const stmt = db.prepare('UPDATE settings SET value = ? WHERE key = ?');
    stmt.run(JSON.stringify(status), 'shopStatus');
    return status;
  } catch (error) {
    console.error('Error updating shop status:', error);
    throw error;
  }
}

// Password hashing functions
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, hash] = storedHash.split(':');
  const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

// Auth token management
function createAuthToken() {
  try {
    const token = crypto.randomBytes(32).toString('hex');
    const createdAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
    
    db.prepare('INSERT INTO auth_tokens (token, createdAt, expiresAt) VALUES (?, ?, ?)').run(token, createdAt, expiresAt);
    return token;
  } catch (error) {
    throw new Error('Failed to create auth token');
  }
}

function verifyAuthToken(token) {
  try {
    const result = db.prepare('SELECT * FROM auth_tokens WHERE token = ?').get(token);
    if (!result) return false;
    
    const now = new Date().toISOString();
    if (now > result.expiresAt) {
      // Token expired, delete it
      db.prepare('DELETE FROM auth_tokens WHERE token = ?').run(token);
      return false;
    }
    return true;
  } catch (error) {
    return false;
  }
}

function deleteAuthToken(token) {
  try {
    db.prepare('DELETE FROM auth_tokens WHERE token = ?').run(token);
    return true;
  } catch (error) {
    return false;
  }
}

function verifyAdminPassword(password) {
  try {
    const result = db.prepare('SELECT value FROM settings WHERE key = ?').get('adminPassword');
    if (!result) return false;
    return verifyPassword(password, result.value);
  } catch (error) {
    return false;
  }
}

function updateAdminPassword(newPassword) {
  try {
    const hashedPassword = hashPassword(newPassword);
    db.prepare('UPDATE settings SET value = ? WHERE key = ?').run(hashedPassword, 'adminPassword');
    // Clear all existing tokens when password changes
    db.prepare('DELETE FROM auth_tokens').run();
    return true;
  } catch (error) {
    return false;
  }
}

// Graceful shutdown
process.on('exit', () => db.close());
process.on('SIGINT', () => {
  db.close();
  process.exit(0);
});

module.exports = {
  initializeDatabase,
  getAllBookings,
  createBooking,
  updateBooking,
  deleteBooking,
  getNotifications,
  createNotification,
  getShopStatus,
  updateShopStatus,
  createAuthToken,
  verifyAuthToken,
  deleteAuthToken,
  verifyAdminPassword,
  updateAdminPassword
};
