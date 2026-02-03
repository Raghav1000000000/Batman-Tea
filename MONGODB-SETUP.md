# MongoDB Atlas Setup Guide

## 🍃 Migrate from SQLite to MongoDB Atlas (Cloud Database)

### Why MongoDB Atlas?
- ✅ **Free Tier Available** - 512MB storage, perfect for this app
- ✅ **Cloud-Hosted** - Access from anywhere
- ✅ **No Server Required** - Fully managed service
- ✅ **Works with Vercel** - Perfect for serverless deployment
- ✅ **Automatic Backups** - Built-in data protection
- ✅ **Scalable** - Upgrade as you grow

---

## Step 1: Create MongoDB Atlas Account

1. **Sign Up**:
   - Go to [mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register)
   - Sign up with Google/GitHub or email
   - Verify your email

2. **Create Organization** (if prompted):
   - Organization Name: `Batman Tea` or any name
   - Click "Next"

3. **Create Project**:
   - Project Name: `batman-tea-app`
   - Click "Create Project"

---

## Step 2: Create Free Cluster

1. **Build a Database**:
   - Click "Build a Database" (or "+ Create" button)
   - Select **"M0 FREE"** tier
   - Choose a cloud provider & region:
     - AWS / Google Cloud / Azure (any works)
     - Choose region closest to you (e.g., `US East (N. Virginia)`)
   - Cluster Name: `batman-tea-cluster` (or keep default)
   - Click **"Create"**

2. **Wait for Cluster Creation** (1-3 minutes)

---

## Step 3: Configure Security

### A. Create Database User

1. **Security Quickstart** appears automatically
2. **Authentication Method**: Username and Password
3. **Username**: `batman-tea-admin`
4. **Password**: Click "Autogenerate Secure Password" (copy it!)
   - Or create your own strong password
   - **IMPORTANT**: Save this password - you'll need it!
5. Click "Create User"

### B. Configure Network Access

1. **IP Access List**: 
   - **For Development**: Click "Add My Current IP Address"
   - **For Production/Vercel**: Add `0.0.0.0/0` (Allow access from anywhere)
     - ⚠️ This is safe because you still need username/password
2. Click "Finish and Close"
3. Click "Go to Database"

---

## Step 4: Get Connection String

1. **Connect to Cluster**:
   - Click the **"Connect"** button on your cluster
   - Select **"Drivers"**
   - Driver: **Node.js**
   - Version: **6.8 or later**

2. **Copy Connection String**:
   ```
   mongodb+srv://batman-tea-admin:<password>@batman-tea-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

3. **Replace `<password>`** with your actual password:
   ```
   mongodb+srv://batman-tea-admin:YourPassword123@batman-tea-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

4. **Add Database Name** before the `?`:
   ```
   mongodb+srv://batman-tea-admin:YourPassword123@batman-tea-cluster.xxxxx.mongodb.net/batman-tea?retryWrites=true&w=majority
   ```

---

## Step 5: Update Your Application

### A. Local Development

1. **Update `.env` file**:
```bash
# Old (SQLite)
# DB_NAME=batman-tea.db

# New (MongoDB Atlas)
MONGODB_URI=mongodb+srv://batman-tea-admin:YourPassword123@batman-tea-cluster.xxxxx.mongodb.net/batman-tea?retryWrites=true&w=majority
```

2. **Test locally**:
```bash
npm start
```

3. **Verify connection**:
   - Check terminal for: "✅ MongoDB connected successfully!"
   - Test creating a booking on http://localhost:3000

### B. Vercel Deployment

1. **Go to Vercel Dashboard**:
   - Select your batman-tea project
   - Settings → Environment Variables

2. **Add MONGODB_URI**:
   - Name: `MONGODB_URI`
   - Value: `mongodb+srv://batman-tea-admin:YourPassword123@...`
   - Apply to: Production, Preview, Development
   - Click "Save"

3. **Redeploy**:
   - Go to Deployments tab
   - Click "Redeploy" on latest deployment
   - Or push new commit to GitHub (auto-deploys)

---

## Step 6: Verify Database

### Check Data in MongoDB Atlas

1. **Browse Collections**:
   - Go to MongoDB Atlas Dashboard
   - Click "Browse Collections" on your cluster
   - You should see database: `batman-tea`
   - Collections: `bookings`, `notifications`, `settings`, `authtokens`

2. **View Data**:
   - Click any collection to see documents
   - Bookings will appear after customers submit requests

---

## Migration from SQLite

### If You Have Existing Data

Your old SQLite data won't automatically transfer. To migrate:

#### Option 1: Fresh Start (Recommended)
- Just start using MongoDB
- Old bookings in SQLite stay in `batman-tea.db` file
- New bookings go to MongoDB

#### Option 2: Manual Migration
If you have important bookings to keep:

1. **Export from SQLite** (run in terminal):
```javascript
const Database = require('better-sqlite3');
const db = new Database('batman-tea.db');
const bookings = db.prepare('SELECT * FROM bookings').all();
console.log(JSON.stringify(bookings, null, 2));
```

2. **Import to MongoDB** (create script or manually add via Atlas)

---

## Troubleshooting

### Connection Failed

**Error**: `MongoServerError: bad auth`
- **Solution**: Check username/password in connection string

**Error**: `MongooseServerSelectionError: Could not connect`
- **Solution 1**: Check IP whitelist in Atlas (add `0.0.0.0/0`)
- **Solution 2**: Check internet connection
- **Solution 3**: Verify connection string format

**Error**: `MONGODB_URI is not defined`
- **Solution**: Add MONGODB_URI to `.env` file

### Slow Performance

- **Cause**: Free tier has limited resources
- **Solution**: Upgrade to paid tier if needed (M10: $0.08/hour)

### Data Not Showing

1. Check database name in connection string matches
2. Verify you're looking at correct cluster
3. Check collection names are correct

---

## Database Comparison

| Feature | SQLite (Old) | MongoDB Atlas (New) |
|---------|--------------|---------------------|
| **Hosting** | Local file | Cloud-hosted |
| **Vercel Compatible** | ❌ Resets on deploy | ✅ Persistent |
| **Free Tier** | ✅ Free | ✅ 512MB free |
| **Backups** | Manual | Automatic |
| **Scaling** | Limited | Easy |
| **Concurrent Access** | Limited | Excellent |
| **Setup Complexity** | Easy | Moderate |

---

## Security Best Practices

1. **Strong Passwords**:
   - Use autogenerated passwords
   - Don't use simple passwords like "password123"

2. **Network Access**:
   - For production: `0.0.0.0/0` is fine (password-protected)
   - For extra security: Whitelist specific IPs

3. **Connection String**:
   - Never commit to GitHub
   - Always use environment variables
   - .env file is already in .gitignore ✅

4. **Database User**:
   - Use least privilege principle
   - Create separate users for dev/prod if needed

---

## Monitoring

### MongoDB Atlas Dashboard

Monitor your database:
- **Metrics**: CPU, memory, disk usage
- **Performance**: Query performance insights
- **Alerts**: Set up email alerts for issues

Access at: https://cloud.mongodb.com

---

## Cost

### Free Tier (M0)
- **Storage**: 512 MB
- **RAM**: Shared
- **Backup**: Manual only
- **Cost**: $0 (forever)
- **Good for**: Development, small apps, demos

### Paid Tiers
- **M10**: $0.08/hour (~$57/month) - Production-ready
- **M20**: $0.20/hour (~$146/month) - High traffic
- **Auto-scaling available**

**Batman Tea app** will work fine on free tier for most use cases!

---

## Next Steps

1. ✅ Create MongoDB Atlas account
2. ✅ Create free cluster
3. ✅ Get connection string
4. ✅ Update .env with MONGODB_URI
5. ✅ Test locally
6. ✅ Deploy to Vercel with MONGODB_URI
7. ✅ Verify data persists

---

## Quick Reference

### Connection String Format
```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
```

### Required Environment Variables
```bash
MONGODB_URI=mongodb+srv://...
NODE_ENV=production
DEFAULT_ADMIN_PASSWORD=your-password
SESSION_SECRET=your-secret
ALLOWED_ORIGINS=https://your-app.vercel.app
```

---

**Setup Time**: 10-15 minutes
**Difficulty**: Easy ⭐⭐☆☆☆

Your Batman Tea app is now cloud-ready with persistent MongoDB storage! 🚀🍃
