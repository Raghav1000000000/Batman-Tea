# Vercel Deployment Guide

## 🚀 Deploy Batman Tea to Vercel with GitHub

### Prerequisites
- GitHub account
- Vercel account (free tier available)
- Git installed on your computer

---

## Step-by-Step Deployment

### Step 1: Push to GitHub

1. **Initialize Git Repository** (if not already done):
```bash
cd "C:\Users\ragha\OneDrive\Desktop\WEB agency\Batman Tea"
git init
```

2. **Add all files**:
```bash
git add .
```

3. **Commit**:
```bash
git commit -m "Initial commit - Batman Tea booking app"
```

4. **Create GitHub Repository**:
   - Go to [github.com](https://github.com)
   - Click "New Repository"
   - Name: `batman-tea` (or any name you prefer)
   - Don't initialize with README (you already have one)
   - Click "Create Repository"

5. **Push to GitHub**:
```bash
git remote add origin https://github.com/YOUR_USERNAME/batman-tea.git
git branch -M main
git push -u origin main
```

---

### Step 2: Deploy to Vercel

1. **Sign in to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Sign Up" or "Log In"
   - Choose "Continue with GitHub"
   - Authorize Vercel to access your GitHub repositories

2. **Import Project**:
   - Click "Add New..." → "Project"
   - Find and select your `batman-tea` repository
   - Click "Import"

3. **Configure Project**:
   - **Framework Preset**: Leave as "Other" or "Node.js"
   - **Root Directory**: `./` (default)
   - **Build Command**: (leave empty, using default)
   - **Output Directory**: (leave empty)

4. **Add Environment Variables**:
   Click "Environment Variables" and add these:

   ```
   Variable Name                    | Value
   --------------------------------|----------------------------------
   NODE_ENV                        | production
   DEFAULT_ADMIN_PASSWORD          | YourSecurePassword123!
   SESSION_SECRET                  | [generate using command below]
   ALLOWED_ORIGINS                 | https://your-app.vercel.app
   MAX_LOGIN_ATTEMPTS_PER_MINUTE   | 5
   MAX_API_REQUESTS_PER_MINUTE     | 100
   DB_NAME                         | batman-tea.db
   ```

   **Generate SESSION_SECRET**:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Copy the output and paste as SESSION_SECRET value

5. **Deploy**:
   - Click "Deploy"
   - Wait 1-2 minutes for deployment to complete
   - You'll see "Congratulations!" when done

6. **Get Your URL**:
   - Your app will be at: `https://your-app-name.vercel.app`
   - Vercel generates a random name, or you can customize it

---

### Step 3: Update ALLOWED_ORIGINS

1. After deployment, go to Vercel Dashboard
2. Click your project → "Settings" → "Environment Variables"
3. Find `ALLOWED_ORIGINS`
4. Update with your actual Vercel URL: `https://your-actual-app.vercel.app`
5. Redeploy from "Deployments" tab

---

### Step 4: Change Dashboard Password

1. Visit `https://your-app.vercel.app/dashboard`
2. Login with your `DEFAULT_ADMIN_PASSWORD`
3. Open browser console (F12)
4. Run this script:
```javascript
const currentPassword = 'YourSecurePassword123!'; // Your DEFAULT_ADMIN_PASSWORD
const newPassword = 'EvenMoreSecurePassword456!';
const token = localStorage.getItem('dashboardAuthToken');

fetch(window.location.origin + '/api/auth/change-password', {
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

---

## ⚠️ Important: Database Limitation

### The Issue
Vercel uses **serverless functions** that are **stateless**. This means:
- ❌ SQLite database file will be **lost** after each deployment
- ❌ All bookings will be **deleted** when you redeploy
- ❌ Not suitable for production with current SQLite setup

### Solutions

#### Option 1: Switch to Cloud Database (Recommended for Vercel)

**A. Vercel Postgres (Best for Vercel)**
```bash
# Install Vercel Postgres
npm install @vercel/postgres

# In Vercel Dashboard:
# 1. Go to Storage tab
# 2. Create Postgres Database
# 3. Connection string automatically added to env vars
```

**B. MongoDB Atlas (Easiest)**
1. Create free account at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create cluster (free tier available)
3. Get connection string
4. Add to Vercel env: `MONGODB_URI=mongodb+srv://...`
5. Update database.js to use MongoDB instead of SQLite

**C. PlanetScale (MySQL)**
1. Create free account at [planetscale.com](https://planetscale.com)
2. Create database
3. Get connection string
4. Add to Vercel environment variables

#### Option 2: Use Different Platform with Persistent Storage

**Railway (Recommended for SQLite)** ⭐
- Supports persistent disk storage
- Free tier available
- Easy GitHub deployment
- SQLite works perfectly

**Steps**:
1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. "New Project" → "Deploy from GitHub repo"
4. Select batman-tea repository
5. Add environment variables
6. Deploy (keeps SQLite database)

**DigitalOcean App Platform**
- $5/month (no free tier)
- Persistent disk storage
- SQLite works

**Render.com**
- Free tier available
- Persistent disk storage
- SQLite works

---

## Recommended Deployment Strategy

### For Testing/Demo
✅ **Use Vercel** - Fast, free, easy
- Accept that database resets on deploy
- Perfect for showing the app to clients

### For Production
✅ **Use Railway or DigitalOcean**
- Keeps your SQLite database
- No code changes needed
- Persistent data storage

**OR**

✅ **Upgrade Vercel + Cloud Database**
- Best performance
- Scalable
- Requires code changes (switch from SQLite)

---

## Monitoring Your Deployment

### Vercel Dashboard
- View deployment logs
- Monitor function executions
- Check error rates
- View analytics

### Access Logs
On Vercel, logs are available in:
- "Deployments" tab → Click deployment → "Functions" tab
- Real-time logs during deployment

---

## Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project
2. Click "Settings" → "Domains"
3. Add your custom domain: `teatime.com`
4. Follow DNS configuration instructions
5. SSL certificate automatically provisioned

---

## Continuous Deployment

Vercel automatically redeploys when you push to GitHub:

```bash
# Make changes to your code
git add .
git commit -m "Updated feature X"
git push

# Vercel automatically detects and deploys!
```

---

## Troubleshooting

### Database Resets After Deploy
**Cause**: Vercel serverless is stateless
**Solution**: Use persistent database (see solutions above)

### CORS Errors
**Cause**: ALLOWED_ORIGINS not matching your Vercel URL
**Solution**: Update ALLOWED_ORIGINS env variable with correct URL

### 404 on Routes
**Cause**: vercel.json not properly configured
**Solution**: Ensure vercel.json exists and matches the provided template

### Rate Limiting Too Strict
**Cause**: Default limits too low for your traffic
**Solution**: Increase MAX_API_REQUESTS_PER_MINUTE in environment variables

### Dashboard Login Fails
**Cause**: Wrong password or SESSION_SECRET not set
**Solution**: 
1. Check DEFAULT_ADMIN_PASSWORD env variable
2. Ensure SESSION_SECRET is set and valid

---

## Environment Variables Summary

Copy this checklist when deploying:

```bash
# Required
NODE_ENV=production
DEFAULT_ADMIN_PASSWORD=<your-secure-password>
SESSION_SECRET=<64-char-random-string>
ALLOWED_ORIGINS=https://your-app.vercel.app

# Optional (has defaults)
MAX_LOGIN_ATTEMPTS_PER_MINUTE=5
MAX_API_REQUESTS_PER_MINUTE=100
DB_NAME=batman-tea.db
```

---

## Cost Comparison

| Platform | Free Tier | SQLite Support | Best For |
|----------|-----------|----------------|----------|
| **Vercel** | ✅ Yes | ❌ No (resets) | Demos, prototypes |
| **Railway** | ✅ $5 credit | ✅ Yes | Production with SQLite |
| **Render** | ✅ Yes | ✅ Yes | Production with SQLite |
| **DigitalOcean** | ❌ $5/mo | ✅ Yes | Full production |
| **Heroku** | ❌ $7/mo | ⚠️ With add-on | Legacy apps |

---

## Next Steps After Deployment

1. ✅ Test the customer booking page
2. ✅ Test dashboard login
3. ✅ Change default password
4. ✅ Submit a test booking
5. ✅ Test notifications
6. ✅ Test shop open/close
7. ✅ Share URL with your client!

---

## Support

If you encounter issues:
1. Check Vercel function logs
2. Verify environment variables are set
3. Check ALLOWED_ORIGINS matches your URL
4. Review browser console for errors
5. Check network tab for failed requests

---

**Deployment Time**: 5-10 minutes
**Cost**: Free (Vercel free tier)
**Difficulty**: Easy ⭐⭐☆☆☆

Good luck with your deployment! 🚀
