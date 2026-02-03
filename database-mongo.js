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
    await mongoose.connect(MONGODB_URI);
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
  name: { type: String, required: true },
  phone: { type: String, required: true, index: true },
  location: { type: String, required: true },
  customLocation: String,
  notes: String,
  status: { type: String, default: 'pending', index: true },
  eta: String,
  createdAt: { type: Date, default: Date.now, index: true }
});

const notificationSchema = new mongoose.Schema({
  message: { type: String, required: true },
  location: String,
  createdAt: { type: Date, default: Date.now, index: true }
});

const settingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true }
});

const authTokenSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true, index: true }
});

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

async function deleteBooking(id) {
  await connectToDatabase();
  const result = await Booking.findByIdAndDelete(id);
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

async function createNotification(message, location = null) {
  await connectToDatabase();
  const notification = await Notification.create({ message, location });
  return notification.toObject();
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
  getShopStatus,
  updateShopStatus,
  createAuthToken,
  verifyAuthToken,
  deleteAuthToken,
  verifyAdminPassword,
  updateAdminPassword
};
