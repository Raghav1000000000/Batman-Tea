# Batman Tea Booking App 🛵☕

A production-ready web application for managing mobile tea delivery bookings with enterprise-grade security.

## 🛡️ Security Features

### Production-Level Security Implemented
- ✅ **Helmet.js** - Security headers (XSS, clickjacking, MIME sniffing protection)
- ✅ **Rate Limiting** - Prevents brute force attacks (5 login attempts/min, 100 API requests/min)
- ✅ **CORS Protection** - Configurable origin whitelist
- ✅ **Input Validation** - Express-validator sanitizes all user inputs
- ✅ **Request Size Limits** - 10KB max to prevent DoS attacks
- ✅ **Password Hashing** - PBKDF2-SHA512 with 10,000 iterations
- ✅ **Token-Based Auth** - 7-day session validity with automatic cleanup
- ✅ **Access Logging** - Morgan logs all requests (production mode)
- ✅ **Environment Variables** - Secrets stored in .env file
- ✅ **Error Handling** - Proper error messages without leaking sensitive data

## Features

### Customer Side
- **Simple One-Page Booking Form**
  - Name and phone number collection
  - Location selection (dropdown with custom option)
  - Additional notes field
  - Real-time notifications from tea man (refreshes every 5 seconds)
  - Shop status check (shows "Closed" message when shop is not accepting orders)

### Tea Man Dashboard
- **Authentication**
  - Secure password-protected dashboard access
  - Token-based authentication (7-day validity)
  - Default password: `teatime` (change after first login)
  - Logout functionality

- **Booking Management**
  - View all booking requests with status (pending/accepted/rejected)
  - Accept or reject requests
  - Add ETA for accepted bookings
  - Delete completed bookings
  - Auto-refresh every 5 seconds

- **Shop Controls**
  - Open/Close toggle button
  - When closed, customers see "Coming Soon" message

- **Statistics**
  - Pending requests count
  - Today's accepted bookings
  - Total bookings

- **Customer Notifications**
  - Broadcast messages to all customers
  - Include current location in notifications
  - Updates appear on customer page automatically

## 🚀 Quick Deploy to Vercel

### One-Click Deployment

1. **Push to GitHub**:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/batman-tea.git
git push -u origin main
```

2. **Deploy to Vercel**:
   - Visit [vercel.com](https://vercel.com) and sign in with GitHub
   - Click "New Project"
   - Import your `batman-tea` repository
   - Configure environment variables (see below)
   - Click "Deploy"

3. **Configure Environment Variables** in Vercel Dashboard:
```
NODE_ENV=production
DEFAULT_ADMIN_PASSWORD=your-secure-password
SESSION_SECRET=your-random-64-char-secret
ALLOWED_ORIGINS=https://your-app.vercel.app
MAX_LOGIN_ATTEMPTS_PER_MINUTE=5
MAX_API_REQUESTS_PER_MINUTE=100
DB_NAME=batman-tea.db
```

4. **Generate SESSION_SECRET**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Vercel Configuration

The included `vercel.json` automatically configures:
- ✅ Node.js runtime
- ✅ API routing
- ✅ Static file serving
- ✅ Production environment

### Important Notes for Vercel
- ⚠️ **Database Limitation**: Vercel uses serverless functions. The SQLite database will reset on each deployment.
- 💡 **Solution**: For production, consider upgrading to:
  - PostgreSQL (Vercel Postgres)
  - MongoDB Atlas
  - PlanetScale (MySQL)
  - Or use persistent storage solution

### Alternative: Use Railway/DigitalOcean for SQLite
If you want to keep SQLite (persistent storage):
- Deploy to **Railway.app** (recommended for SQLite)
- Deploy to **DigitalOcean App Platform**
- Deploy to **Render.com**

All these platforms support persistent disk storage for SQLite databases.

## Database

This app now supports both **SQLite** (local) and **MongoDB Atlas** (cloud)!

### 🍃 MongoDB Atlas (Recommended for Production)
- ✅ **Cloud-Hosted** - Works perfectly with Vercel
- ✅ **Free Tier** - 512MB storage included
- ✅ **Persistent Data** - No data loss on deployment
- ✅ **Auto Backups** - Built-in data protection
- ✅ **Scalable** - Grows with your business

**Setup Guide**: See [MONGODB-SETUP.md](MONGODB-SETUP.md) for step-by-step instructions

### 💾 SQLite (Local Development)
- ✅ **Zero Setup** - No installation needed
- ✅ **Fast** - Perfect for local testing
- ⚠️ **Vercel Limitation** - Database resets on deployment

**Current Mode**: The app is configured to use MongoDB. To switch back to SQLite, change `database-mongo.js` to `database.js` in `server.js`

### Why MongoDB Atlas?
- ✅ **Zero Setup**: No installation or configuration needed
- ✅ **Fast**: High-performance local database
- ✅ **Reliable**: Single file storage, easy to backup
- ✅ **Perfect for Small Apps**: Handles thousands of bookings effortlessly

## Installation

### Development Setup

1. Clone the repository and install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
# Copy the example file
cp .env.example .env

# Edit .env with your settings
# IMPORTANT: Change DEFAULT_ADMIN_PASSWORD and SESSION_SECRET
```

3. Start the development server:
```bash
npm start
```

4. Access the application:
   - Customer booking page: http://localhost:3000
   - Tea man dashboard: http://localhost:3000/dashboard
   - Default dashboard password: `teatime` (⚠️ CHANGE IMMEDIATELY)

### Production Deployment

1. **Set Environment Variables**:
```bash
# .env file for production
NODE_ENV=production
PORT=3000
DEFAULT_ADMIN_PASSWORD=your-secure-password-here
SESSION_SECRET=random-64-character-secret-string
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
MAX_LOGIN_ATTEMPTS_PER_MINUTE=5
MAX_API_REQUESTS_PER_MINUTE=100
DB_NAME=batman-tea.db
```

2. **Generate Strong Secrets**:
```bash
# Generate SESSION_SECRET (run in terminal)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

3. **Setup HTTPS** (Required for production):
   - Use reverse proxy (nginx/Apache) with SSL certificate
   - Or deploy to platforms with built-in HTTPS (Heroku, Railway, DigitalOcean App Platform)

4. **Configure Firewall**:
```bash
# Allow only necessary ports
# Example: ufw allow 80/tcp && ufw allow 443/tcp
```

5. **Start with Process Manager**:
```bash
# Install PM2 (recommended)
npm install -g pm2

# Start the app
pm2 start server.js --name batman-tea

# Enable startup on reboot
pm2 startup
pm2 save
```

6. **Setup Automated Backups**:
```bash
# Create backup script (backup.sh)
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
cp batman-tea.db backups/batman-tea_$DATE.db
find backups/ -mtime +7 -delete  # Keep last 7 days

# Add to crontab (run daily at 2 AM)
0 2 * * * /path/to/backup.sh
```

## Tech Stack

### Backend
- **Node.js + Express** - Web server framework
- **MongoDB + Mongoose** - Cloud database (MongoDB Atlas)
- **SQLite (better-sqlite3)** - Local development option
- **Helmet** - Security headers middleware
- **Express Rate Limit** - API rate limiting
- **Express Validator** - Input validation and sanitization
- **Morgan** - HTTP request logging
- **Dotenv** - Environment variable management

### Frontend
- **HTML5, CSS3** - Modern responsive design
- **Vanilla JavaScript** - No framework dependencies
- **localStorage** - Session persistence

### Security
- **Crypto (Node.js)** - PBKDF2 password hashing
- **CORS** - Cross-Origin Resource Sharing protection
- **CSP** - Content Security Policy headers

Database file: `batman-tea.db` (auto-created on first run)

## Database Schema

### Bookings Table
- **id** (TEXT PRIMARY KEY)
- **name** (TEXT)
- **phone** (TEXT) - Indexed for fast lookups
- **location** (TEXT)
- **customLocation** (TEXT)
- **notes** (TEXT)
- **status** (TEXT) - pending/accepted/rejected
- **eta** (TEXT)
- **createdAt** (TEXT) - ISO timestamp

### Notifications Table
- **id** (TEXT PRIMARY KEY)
- **message** (TEXT)
- **location** (TEXT)
- **createdAt** (TEXT)

### Settings Table
- **key** (TEXT PRIMARY KEY)
- **value** (TEXT) - JSON stored as text
- Stores shop status and admin password (hashed)

### Auth Tokens Table
- **token** (TEXT PRIMARY KEY)
- **createdAt** (TEXT)
- **expiresAt** (TEXT)
- Stores dashboard authentication tokens (7-day expiry)

## Usage

### For Customers
1. Open http://localhost:3000
2. Fill in your details (name, phone, location)
3. Add any special notes
4. Click "Request Tea Delivery"
5. Wait for the tea man to accept your request

### For Tea Man
1. Open http://localhost:3000/dashboard
2. Toggle shop status (Open/Close)
3. View incoming booking requests
4. Accept or reject requests
5. Add ETA for accepted bookings
6. Send notifications to all customers about your location or updates
7. Dashboard refreshes automatically every 5 seconds

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login to dashboard (password required)
- `POST /api/auth/verify` - Verify auth token
- `POST /api/auth/logout` - Logout from dashboard
- `POST /api/auth/change-password` - Change dashboard password

### Bookings & Shop Management
- `GET /api/bookings` - Get all bookings
- `POST /api/bookings` - Create new booking
- `PUT /api/bookings/:id` - Update booking status/ETA
- `DELETE /api/bookings/:id` - Delete booking
- `GET /api/notifications` - Get notifications
- `POST /api/notifications` - Create notification
- `GET /api/shop-status` - Get shop open/closed status
- `POST /api/shop-status` - Update shop status

## Security

### Dashboard Authentication
- **Default Password**: `teatime` (⚠️ **CHANGE IMMEDIATELY** after first login!)
- **Token-based Auth**: Sessions last 7 days, automatically cleaned up on expiry
- **Password Hashing**: PBKDF2 with SHA-512 (10,000 iterations) + unique salt per password
- **Secure Storage**: Tokens stored in localStorage, validated server-side on each request
- **Rate Limited**: Maximum 5 login attempts per minute to prevent brute force

### Production Security Checklist

#### ✅ Before Deploying:
1. **Change Default Password**
   ```javascript
   // Login to dashboard, then run in browser console:
   const currentPassword = 'teatime';
   const newPassword = 'YourSecure123Password!';
   const token = localStorage.getItem('dashboardAuthToken');
   
   fetch('http://localhost:3000/api/auth/change-password', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ token, currentPassword, newPassword })
   }).then(r => r.json()).then(data => {
       if (data.success) {
           localStorage.setItem('dashboardAuthToken', data.token);
           alert('Password changed successfully!');
       } else {
           alert('Error: ' + data.message);
       }
   });
   ```

2. **Configure Environment Variables**
   ```bash
   # Generate secure SESSION_SECRET
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   
   # Update .env file
   SESSION_SECRET=<generated-secret-here>
   NODE_ENV=production
   ALLOWED_ORIGINS=https://yourdomain.com
   ```

3. **Enable HTTPS**
   - Required for production
   - Use Let's Encrypt for free SSL certificates
   - Configure reverse proxy (nginx/Apache) with SSL

4. **Configure CORS**
   ```bash
   # In .env, list allowed domains
   ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
   ```

5. **Set Rate Limits**
   ```bash
   # Adjust based on your traffic
   MAX_LOGIN_ATTEMPTS_PER_MINUTE=5
   MAX_API_REQUESTS_PER_MINUTE=100
   ```

6. **Database Backups**
   - Setup automated daily backups
   - Store backups off-site (cloud storage)
   - Test restore procedure

7. **Monitoring**
   - Enable access logging (automatic in production mode)
   - Monitor `access.log` for suspicious activity
   - Setup alerts for repeated failed login attempts

#### 🛡️ Security Features Active:
- ✅ **Helmet.js** - Sets secure HTTP headers
- ✅ **Rate Limiting** - 5 login attempts/min, 100 API requests/min
- ✅ **CORS Protection** - Whitelist-based origin validation
- ✅ **Input Validation** - All user inputs sanitized and validated
- ✅ **XSS Protection** - Content Security Policy headers
- ✅ **Request Size Limits** - 10KB maximum payload
- ✅ **Password Security** - Industry-standard hashing
- ✅ **Token Expiry** - Automatic session cleanup
- ✅ **Error Handling** - No sensitive data leakage

#### ⚠️ Additional Production Recommendations:
- **Use HTTPS** - Encrypt all traffic (required!)
- **Firewall Rules** - Restrict access to necessary ports only
- **Regular Updates** - Keep dependencies updated (`npm audit`)
- **IP Whitelisting** - Restrict dashboard access to known IPs (optional)
- **Backup Strategy** - Automated daily backups with off-site storage
- **Monitoring & Alerts** - Setup uptime monitoring and error alerts
- **DDoS Protection** - Use Cloudflare or similar CDN
- **Database Encryption** - Encrypt database file at rest (optional)

### Password Requirements
- Minimum 8 characters for new passwords
- Change default password before production deployment
- Use strong, unique passwords
- Don't share dashboard credentials

### Best Practices
- ✅ Change default password immediately
- ✅ Use a strong password (12+ characters)
- ✅ Logout when done using the dashboard
- ✅ Don't share your dashboard URL publicly
- ⚠️ For production: Add HTTPS, rate limiting, and IP whitelisting

## Backup & Data Management

### Backup Your Data
Simply copy the `batman-tea.db` file to backup all your bookings and data.

### Reset Database
Delete `batman-tea.db` file and restart the server to start fresh.

### View Database
Use [DB Browser for SQLite](https://sqlitebrowser.org/) to view and manage your data.

## Customization

### Adding More Locations
Edit `public/index.html` and add more options in the location dropdown:
```html
<option value="Your Location">Your Location</option>
```

### Changing Refresh Intervals
- Dashboard: Edit the interval in `dashboard.html` (default: 5 seconds)
- Customer page: Edit the interval in `index.html` (default: 5 seconds)

## Performance Best Practices

- ✅ Indexed columns for fast queries (phone, status, createdAt)
- ✅ Write-Ahead Logging (WAL) enabled for better concurrency
- ✅ Notifications auto-limited to last 50 items
- ✅ Synchronous API for predictable performance
- ✅ Single database file for easy management

## Future Enhancements

- SMS notifications to customers
- Real-time updates using WebSockets
- Google Maps integration for location picker
- Customer booking history and favorites
- Payment integration
- Mobile app (React Native)
- Export bookings to CSV/Excel
- Upgrade to PostgreSQL/MySQL for larger scale

## License

ISC
