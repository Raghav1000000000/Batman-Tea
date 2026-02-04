const mongoose = require('mongoose');
const crypto = require('crypto');
require('dotenv').config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/batman-tea';

let isConnected = false;

async function connectToDatabase() {
  if (isConnected) {
    console.log('✅ Using existing MongoDB connection');
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });
    isConnected = true;
    console.log('✅ MongoDB connected successfully!');
    console.log(`📁 Database: ${MONGODB_URI.split('/').pop()}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    throw error;
  }
}

// Schemas
const bookingSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true, index: true },
  location: { type: String, required: true, trim: true },
  customLocation: { type: String, trim: true },
  notes: { type: String, trim: true },
  status: { 
    type: String, 
    default: 'pending', 
    enum: ['pending', 'accepted', 'rejected', 'completed'],
    index: true 
  },
  eta: { type: String, trim: true },
  createdAt: { type: Date, default: Date.now, index: true }
});

// Compound index for efficient queries
bookingSchema.index({ status: 1, createdAt: -1 });
bookingSchema.index({ phone: 1, createdAt: -1 });

const notificationSchema = new mongoose.Schema({
  message: { type: String, required: true, trim: true },
  location: { type: String, trim: true },
  createdAt: { type: Date, default: Date.now, index: true }
});

const settingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true }
});

const authTokenSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true, index: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true }
});

// TTL index to automatically delete expired tokens after they expire
authTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Models
const Booking = mongoose.model('Booking', bookingSchema);
const Notification = mongoose.model('Notification', notificationSchema);
const Setting = mongoose.model('Setting', settingSchema);
const AuthToken = mongoose.model('AuthToken', authTokenSchema);

// Initialize database
async function initializeDatabase() {
  try {
    await connectToDatabase();

    // Initialize default password if not exists
    const adminPassword = await Setting.findOne({ key: 'adminPassword' });
    if (!adminPassword) {
      const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'teatime';
      const hashedPassword = hashPassword(defaultPassword);
      await Setting.create({ key: 'adminPassword', value: hashedPassword });
      console.log('✅ Default admin password initialized');
    }

    // Initialize shop status if not exists
    const shopStatus = await Setting.findOne({ key: 'shopStatus' });
    if (!shopStatus) {
      await Setting.create({ key: 'shopStatus', value: JSON.stringify({ isOpen: true }) });
      console.log('✅ Shop status initialized');
    }

    // Clean up expired tokens on startup
    await AuthToken.deleteMany({ expiresAt: { $lt: new Date() } });

    console.log('✅ Database initialization complete');
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
    throw error;
  }
}

// Booking functions
async function getAllBookings() {
  await connectToDatabase();
  return await Booking.find().sort({ createdAt: -1 }).lean();
}

async function createBooking(bookingData) {
  await connectToDatabase();
  const booking = await Booking.create(bookingData);
  return booking.toObject();
}

async function updateBooking(id, phone, updates) {
  await connectToDatabase();
  const query = phone ? { _id: id, phone } : { _id: id };
  const booking = await Booking.findOneAndUpdate(
    query,
    { $set: updates },
    { new: true }
  ).lean();
  return booking;
}

async function deleteBooking(id, phone) {
  await connectToDatabase();
  const query = phone ? { _id: id, phone } : { _id: id };
  const result = await Booking.findOneAndDelete(query);
  return result !== null;
}

// Notification functions
async function getNotifications(limit = 10) {
  await connectToDatabase();
  return await Notification.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

async function createNotification(notificationData) {
  await connectToDatabase();
  const notification = await Notification.create(notificationData);
  return notification.toObject();
}

async function updateNotification(id, updates) {
  await connectToDatabase();
  const notification = await Notification.findByIdAndUpdate(
    id,
    { $set: updates },
    { new: true }
  ).lean();
  return notification;
}

async function deleteNotification(id) {
  await connectToDatabase();
  const result = await Notification.findByIdAndDelete(id);
  return result !== null;
}

// Shop status functions
async function getShopStatus() {
  await connectToDatabase();
  const setting = await Setting.findOne({ key: 'shopStatus' });
  return setting ? JSON.parse(setting.value) : { isOpen: true };
}

async function updateShopStatus(isOpen) {
  await connectToDatabase();
  await Setting.findOneAndUpdate(
    { key: 'shopStatus' },
    { value: JSON.stringify({ isOpen }) },
    { upsert: true }
  );
  return { isOpen };
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
async function createAuthToken() {
  try {
    await connectToDatabase();
    const token = crypto.randomBytes(32).toString('hex');
    const createdAt = new Date();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    await AuthToken.create({ token, createdAt, expiresAt });
    return token;
  } catch (error) {
    throw new Error('Failed to create auth token');
  }
}

async function verifyAuthToken(token) {
  try {
    await connectToDatabase();
    const authToken = await AuthToken.findOne({ token });
    
    if (!authToken) return false;
    
    const now = new Date();
    if (now > authToken.expiresAt) {
      // Token expired, delete it
      await AuthToken.deleteOne({ token });
      return false;
    }
    return true;
  } catch (error) {
    return false;
  }
}

async function deleteAuthToken(token) {
  try {
    await connectToDatabase();
    await AuthToken.deleteOne({ token });
    return true;
  } catch (error) {
    return false;
  }
}

async function verifyAdminPassword(password) {
  try {
    await connectToDatabase();
    const setting = await Setting.findOne({ key: 'adminPassword' });
    if (!setting) return false;
    return verifyPassword(password, setting.value);
  } catch (error) {
    return false;
  }
}

async function updateAdminPassword(newPassword) {
  try {
    await connectToDatabase();
    const hashedPassword = hashPassword(newPassword);
    await Setting.findOneAndUpdate(
      { key: 'adminPassword' },
      { value: hashedPassword },
      { upsert: true }
    );
    // Clear all existing tokens when password changes
    await AuthToken.deleteMany({});
    return true;
  } catch (error) {
    return false;
  }
}

// Daily cleanup function - remove old bookings
async function cleanupOldBookings() {
  try {
    await connectToDatabase();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Delete completed or rejected bookings older than 1 day
    const result = await Booking.deleteMany({
      status: { $in: ['completed', 'rejected'] },
      createdAt: { $lt: oneDayAgo }
    });
    
    if (result.deletedCount > 0) {
      console.log(`🧹 Daily cleanup: Removed ${result.deletedCount} old bookings`);
    }
    
    return result.deletedCount;
  } catch (error) {
    console.error('Error during cleanup:', error.message);
    return 0;
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed');
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
  updateNotification,
  deleteNotification,
  getShopStatus,
  updateShopStatus,
  createAuthToken,
  verifyAuthToken,
  deleteAuthToken,
  verifyAdminPassword,
  updateAdminPassword,
  cleanupOldBookings
};
