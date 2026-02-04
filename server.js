require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const morgan = require('morgan');
const fs = require('fs');
const cron = require('node-cron');
const db = require('./database-mongo'); // Changed to MongoDB

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Initialize database (non-blocking)
db.initializeDatabase().catch(err => {
  console.error('❌ Database initialization failed:', err.message);
  console.log('⚠️  Server will continue but database operations may fail');
});

// Schedule daily cleanup at midnight (00:00) - Only in non-serverless environments
if (process.env.VERCEL !== '1') {
  cron.schedule('0 0 * * *', async () => {
    console.log('🕛 Running daily cleanup task...');
    await db.cleanupOldBookings();
  }, {
    timezone: "Asia/Kolkata"
  });
  console.log('⏰ Daily cleanup scheduled for midnight');
} else {
  console.log('⏰ Cron jobs disabled in serverless environment');
}

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-hashes'"], // Allow inline scripts and event handlers
      scriptSrcAttr: ["'unsafe-inline'"], // Allow inline event handlers (onclick, etc.)
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
    },
  },
}));

// Logging
if (NODE_ENV === 'production') {
  const accessLogStream = fs.createWriteStream(
    path.join(__dirname, 'access.log'),
    { flags: 'a' }
  );
  app.use(morgan('combined', { stream: accessLogStream }));
} else {
  app.use(morgan('dev'));
}

// CORS - Restrict to allowed origins
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:3000'];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // In production, if ALLOWED_ORIGINS not set, allow all (will be configured later)
    if (!process.env.ALLOWED_ORIGINS && NODE_ENV === 'production') {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1 || NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Request size limits
app.use(bodyParser.json({ limit: '10kb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10kb' }));
app.use(express.static('public'));

// Rate Limiting for Authentication
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: parseInt(process.env.MAX_LOGIN_ATTEMPTS_PER_MINUTE) || 5,
  message: { success: false, message: 'Too many login attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: parseInt(process.env.MAX_API_REQUESTS_PER_MINUTE) || 100,
  message: { success: false, message: 'Too many requests, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply general rate limiting to all API routes
app.use('/api/', apiLimiter);

// Input Validation Middleware
const validateBooking = [
  body('name').trim().notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters')
    .escape(),
  body('phone').trim().notEmpty().withMessage('Phone is required')
    .matches(/^[0-9+\-\s()]+$/).withMessage('Invalid phone number format')
    .isLength({ min: 10, max: 20 }).withMessage('Phone must be 10-20 characters'),
  body('location').trim().notEmpty().withMessage('Location is required')
    .isLength({ max: 200 }).withMessage('Location too long')
    .escape(),
  body('customLocation').optional().trim()
    .isLength({ max: 200 }).withMessage('Custom location too long')
    .escape(),
  body('notes').optional().trim()
    .isLength({ max: 500 }).withMessage('Notes too long')
    .escape(),
];

const validateNotification = [
  body('message').trim().notEmpty().withMessage('Message is required')
    .isLength({ min: 1, max: 500 }).withMessage('Message must be 1-500 characters')
    .escape(),
  body('location').optional().trim()
    .isLength({ max: 200 }).withMessage('Location too long')
    .escape(),
];

const validatePassword = [
  body('password').notEmpty().withMessage('Password is required')
    .isLength({ min: 1 }).withMessage('Password cannot be empty'),
];

const validatePasswordChange = [
  body('token').notEmpty().withMessage('Token is required'),
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').notEmpty().withMessage('New password is required')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
];

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      message: 'Validation error', 
      errors: errors.array() 
    });
  }
  next();
};

// Helper function to transform MongoDB _id to id for frontend
const transformMongoDoc = (doc) => {
  if (!doc) return null;
  if (Array.isArray(doc)) return doc.map(transformMongoDoc);
  const transformed = { ...doc };
  if (transformed._id) {
    transformed.id = transformed._id.toString();
    delete transformed._id;
  }
  return transformed;
};

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const mongoose = require('mongoose');
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    environment: NODE_ENV
  };
  res.json(health);
});

// Middleware

// Get all bookings
app.get('/api/bookings', async (req, res) => {
  try {
    const bookings = await db.getAllBookings();
    // Transform and ensure we always return an array
    const transformed = transformMongoDoc(bookings);
    res.json(Array.isArray(transformed) ? transformed : []);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ success: false, message: 'Error fetching bookings' });
  }
});

// Create new booking
app.post('/api/bookings', validateBooking, handleValidationErrors, async (req, res) => {
  try {
    const bookingData = {
      name: req.body.name,
      phone: req.body.phone,
      location: req.body.location,
      customLocation: req.body.customLocation,
      notes: req.body.notes
    };
    
    const booking = await db.createBooking(bookingData);
    res.json({ success: true, booking: transformMongoDoc(booking) });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ success: false, message: 'Error creating booking' });
  }
});

// Update booking status
app.put('/api/bookings/:id', async (req, res) => {
  try {
    const phone = req.body.phone || req.query.phone;
    const updates = {
      status: req.body.status,
      eta: req.body.eta
    };
    
    const booking = await db.updateBooking(req.params.id, phone, updates);
    if (booking) {
      res.json({ success: true, booking: transformMongoDoc(booking) });
    } else {
      res.status(404).json({ success: false, message: 'Booking not found' });
    }
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ success: false, message: 'Error updating booking' });
  }
});

// Delete booking
app.delete('/api/bookings/:id', async (req, res) => {
  try {
    const phone = req.query.phone;
    const success = await db.deleteBooking(req.params.id, phone);
    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, message: 'Booking not found' });
    }
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ success: false, message: 'Error deleting booking' });
  }
});

// Get notifications
app.get('/api/notifications', async (req, res) => {
  try {
    const notifications = await db.getNotifications(20);
    const transformed = transformMongoDoc(notifications);
    const notificationsArray = Array.isArray(transformed) ? transformed : [];
    res.json(notificationsArray);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Error fetching notifications' });
  }
});

// Create notification
app.post('/api/notifications', validateNotification, handleValidationErrors, async (req, res) => {
  try {
    const notificationData = {
      message: req.body.message,
      location: req.body.location
    };
    
    const notification = await db.createNotification(notificationData);
    res.json({ success: true, notification: transformMongoDoc(notification) });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ success: false, message: 'Error creating notification' });
  }
});

// Update notification
app.put('/api/notifications/:id', async (req, res) => {
  try {
    const updates = {
      message: req.body.message,
      location: req.body.location
    };
    
    const notification = await db.updateNotification(req.params.id, updates);
    if (notification) {
      res.json({ success: true, notification: transformMongoDoc(notification) });
    } else {
      res.status(404).json({ success: false, message: 'Notification not found' });
    }
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({ success: false, message: 'Error updating notification' });
  }
});

// Delete notification
app.delete('/api/notifications/:id', async (req, res) => {
  try {
    const success = await db.deleteNotification(req.params.id);
    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, message: 'Notification not found' });
    }
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ success: false, message: 'Error deleting notification' });
  }
});

// Authentication endpoints
app.post('/api/auth/login', authLimiter, validatePassword, handleValidationErrors, async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required' });
    }
    
    const isValid = await db.verifyAdminPassword(password);
    
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }
    
    const token = await db.createAuthToken();
    res.json({ success: true, token });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ success: false, message: 'Error during login' });
  }
});

app.post('/api/auth/verify', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ success: false, message: 'Token is required' });
    }
    
    const isValid = await db.verifyAuthToken(token);
    res.json({ success: isValid });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(500).json({ success: false, message: 'Error verifying token' });
  }
});

app.post('/api/auth/logout', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (token) {
      await db.deleteAuthToken(token);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error during logout:', error);
    res.status(500).json({ success: false, message: 'Error during logout' });
  }
});

app.post('/api/auth/change-password', validatePasswordChange, handleValidationErrors, async (req, res) => {
  try {
    const { token, currentPassword, newPassword } = req.body;
    
    if (!token || !currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    
    // Verify token first
    const isTokenValid = await db.verifyAuthToken(token);
    if (!isTokenValid) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
    
    // Verify current password
    const isPasswordValid = await db.verifyAdminPassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }
    
    // Update password
    await db.updateAdminPassword(newPassword);
    
    // Create new token
    const newToken = await db.createAuthToken();
    res.json({ success: true, token: newToken });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ success: false, message: 'Error changing password' });
  }
});

// Get shop status
app.get('/api/shop-status', async (req, res) => {
  try {
    const status = await db.getShopStatus();
    res.json(status);
  } catch (error) {
    console.error('Error fetching shop status:', error);
    res.status(500).json({ success: false, message: 'Error fetching shop status' });
  }
});

// Update shop status
app.post('/api/shop-status', async (req, res) => {
  try {
    const status = await db.updateShopStatus(req.body.isOpen);
    res.json({ success: true, status });
  } catch (error) {
    console.error('Error updating shop status:', error);
    res.status(500).json({ success: false, message: 'Error updating shop status' });
  }
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/today', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'today.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ success: false, message: 'CORS policy violation' });
  }
  
  res.status(500).json({ 
    success: false, 
    message: NODE_ENV === 'production' ? 'Internal server error' : err.message 
  });
});

app.listen(PORT, () => {
  console.log(`\n🛵☕ Batman Tea Booking Server`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`🌍 Environment: ${NODE_ENV}`);
  console.log(`🚀 Server running: http://localhost:${PORT}`);
  console.log(`👤 Customer page: http://localhost:${PORT}`);
  console.log(`🔐 Dashboard: http://localhost:${PORT}/dashboard`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`\n🛡️  Security Features Enabled:`);
  console.log(`  ✓ Helmet (Security Headers)`);
  console.log(`  ✓ Rate Limiting (${process.env.MAX_LOGIN_ATTEMPTS_PER_MINUTE || 5} login attempts/min)`);
  console.log(`  ✓ CORS Protection`);
  console.log(`  ✓ Input Validation`);
  console.log(`  ✓ Request Size Limits (10kb)`);
  console.log(`  ✓ Password Hashing (PBKDF2-SHA512)`);
  if (NODE_ENV === 'production') {
    console.log(`  ✓ Access Logging (access.log)`);
  }
  console.log(`\n⚠️  Remember to:`);
  console.log(`  - Change default password`);
  console.log(`  - Set SESSION_SECRET in .env`);
  console.log(`  - Configure ALLOWED_ORIGINS for production`);
  console.log(`  - Use HTTPS in production\n`);
});
