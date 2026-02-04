# 🔒 Production Security Setup Guide

## Quick Setup Checklist
- [ ] Change default admin password
- [ ] Generate strong SESSION_SECRET
- [ ] Configure ALLOWED_ORIGINS for your domain
- [ ] Deploy with HTTPS
- [ ] Update environment variables on hosting platform

---

## 1. 🔑 Change Default Password

### Current Status:
- Default password: `teatime` (⚠️ **INSECURE - Change immediately**)

### How to Change:

#### Option A: Using Dashboard (Recommended)
1. Login to dashboard at `/dashboard` with password: `teatime`
2. Look for "Change Password" option in dashboard
3. Enter current password: `teatime`
4. Enter new strong password (min 8 characters)
5. Confirm and save

#### Option B: Using API Directly
```bash
curl -X POST http://localhost:3000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_AUTH_TOKEN",
    "currentPassword": "teatime",
    "newPassword": "YourNewStrongPassword123!"
  }'
```

#### Option C: Update .env File
1. Open `.env` file
2. Change this line:
   ```
   DEFAULT_ADMIN_PASSWORD=teatime
   ```
   To:
   ```
   DEFAULT_ADMIN_PASSWORD=YourNewStrongPassword123!
   ```
3. Restart server
4. Login with new password

### Password Requirements:
- ✅ Minimum 8 characters
- ✅ Mix of uppercase and lowercase
- ✅ Include numbers
- ✅ Include special characters (!@#$%^&*)
- ✅ Don't use common words or patterns

### Example Strong Passwords:
```
BatmanTea@2026!
T3a$D3liv3ry#Secure
MyBatm4nT34!2026
```

---

## 2. 🔐 Generate Strong SESSION_SECRET

### Current Status:
- SESSION_SECRET: `change-this-to-a-random-secure-string-in-production` (⚠️ **INSECURE**)

### How to Generate:

#### Method 1: Using Node.js (Recommended)
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

This generates something like:
```
a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456789012345678901234567890abcdef1234567890abcdef
```

#### Method 2: Using PowerShell
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

#### Method 3: Using Online Generator
Visit: https://randomkeygen.com/
- Choose "CodeIgniter Encryption Keys" or "256-bit WPA Key"

### Update Your .env File:
1. Open `.env`
2. Replace this line:
   ```
   SESSION_SECRET=change-this-to-a-random-secure-string-in-production
   ```
   With your generated secret:
   ```
   SESSION_SECRET=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
   ```

### ⚠️ Important:
- **Never commit** SESSION_SECRET to Git
- **Never share** SESSION_SECRET publicly
- **Generate new** SESSION_SECRET for each environment (dev, staging, prod)
- **Store securely** in environment variables on hosting platform

---

## 3. 🌍 Configure ALLOWED_ORIGINS for Production

### Current Status:
- ALLOWED_ORIGINS: `http://localhost:3000` (⚠️ **Only works locally**)

### What is ALLOWED_ORIGINS?
This controls which domains can make API requests to your server (CORS policy).

### How to Configure:

#### For Vercel Deployment:
If your domain is `batman-tea.vercel.app`:
```
ALLOWED_ORIGINS=https://batman-tea.vercel.app,https://batman-tea-git-main-yourname.vercel.app
```

#### For Custom Domain:
If you have `www.batmantea.com`:
```
ALLOWED_ORIGINS=https://www.batmantea.com,https://batmantea.com
```

#### Multiple Domains:
Separate with commas (no spaces):
```
ALLOWED_ORIGINS=https://www.batmantea.com,https://batmantea.com,https://admin.batmantea.com
```

### Update .env for Production:
```
# Development
ALLOWED_ORIGINS=http://localhost:3000

# Production (update these)
ALLOWED_ORIGINS=https://your-domain.vercel.app,https://www.your-domain.com
```

### For Vercel:
1. Go to Vercel Dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add variable:
   - **Name**: `ALLOWED_ORIGINS`
   - **Value**: `https://your-domain.vercel.app`
   - **Environment**: Production

---

## 4. 🔒 Use HTTPS in Production

### Why HTTPS?
- ✅ Encrypts data in transit
- ✅ Prevents man-in-the-middle attacks
- ✅ Required for modern browsers
- ✅ Better SEO ranking
- ✅ User trust (padlock icon)

### Automatic HTTPS on Hosting Platforms:

#### Vercel (Recommended):
- ✅ **Automatic HTTPS** on all deployments
- ✅ Free SSL certificates
- ✅ Auto-renewal
- ✅ No configuration needed
- Your app automatically gets: `https://your-app.vercel.app`

#### Heroku:
- ✅ **Automatic HTTPS** on `*.herokuapp.com`
- For custom domains: Enable Heroku SSL (paid)

#### Railway:
- ✅ **Automatic HTTPS** on `*.railway.app`
- Free SSL for custom domains

#### Render:
- ✅ **Automatic HTTPS** on all deployments
- Free SSL certificates

### Custom Domain HTTPS:
If you buy a domain (e.g., `batmantea.com`):

1. **Add domain to Vercel:**
   - Go to Project Settings → Domains
   - Add your domain
   - Update DNS records (Vercel provides instructions)

2. **SSL Certificate:**
   - Vercel automatically provisions SSL
   - Usually takes 5-10 minutes
   - No manual configuration needed

### Update Your Code for HTTPS:
Your code already uses relative URLs, so no changes needed! ✅
```javascript
// ✅ Good (works with both HTTP and HTTPS)
fetch('/api/bookings')

// ❌ Bad (hardcoded protocol)
fetch('http://localhost:3000/api/bookings')
```

---

## 5. 📝 Complete Production Setup

### Step-by-Step Deployment:

#### **Step 1: Update .env for Production**
Create a production version:
```bash
# Copy example
cp .env.example .env.production

# Edit .env.production
```

Add production values:
```dotenv
PORT=3000
NODE_ENV=production

# 1. CHANGE THIS PASSWORD
DEFAULT_ADMIN_PASSWORD=YourStrongPassword123!

# 2. GENERATE NEW SECRET (use: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
SESSION_SECRET=YOUR_GENERATED_SECRET_HERE

# 3. ADD YOUR PRODUCTION DOMAIN
ALLOWED_ORIGINS=https://your-domain.vercel.app

# Rate Limiting
MAX_LOGIN_ATTEMPTS_PER_MINUTE=5
MAX_API_REQUESTS_PER_MINUTE=100

# 4. YOUR MONGODB ATLAS URI
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/batman-tea?retryWrites=true&w=majority
```

#### **Step 2: Deploy to Vercel**

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

4. **Add Environment Variables in Vercel:**
   - Go to Vercel Dashboard
   - Select your project
   - Settings → Environment Variables
   - Add each variable:
     - `DEFAULT_ADMIN_PASSWORD`
     - `SESSION_SECRET`
     - `ALLOWED_ORIGINS`
     - `MONGODB_URI`
     - `NODE_ENV` = `production`

5. **Redeploy:**
   ```bash
   vercel --prod
   ```

#### **Step 3: Verify Production Setup**

1. **Check HTTPS:**
   - Visit `https://your-domain.vercel.app`
   - Look for padlock icon 🔒

2. **Test Login:**
   - Go to `/dashboard`
   - Login with new password

3. **Test CORS:**
   - Open browser console
   - Check for CORS errors (should be none)

4. **Check Security Headers:**
   ```bash
   curl -I https://your-domain.vercel.app
   ```
   Should see:
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY`
   - `Strict-Transport-Security`

---

## 6. 🛡️ Security Checklist

### Before Going Live:
- [ ] Changed default password from `teatime`
- [ ] Generated strong SESSION_SECRET (64+ characters)
- [ ] Updated ALLOWED_ORIGINS with production domain
- [ ] Using HTTPS (automatic on Vercel)
- [ ] Environment variables set in hosting platform
- [ ] `.env` added to `.gitignore` (never commit secrets)
- [ ] Tested login flow in production
- [ ] Tested API endpoints work
- [ ] Verified CORS allows your domain
- [ ] MongoDB connection string uses strong password
- [ ] Rate limiting enabled
- [ ] Helmet security headers active

### Optional (Recommended):
- [ ] Set up monitoring (Vercel Analytics)
- [ ] Configure custom domain
- [ ] Enable 2FA on hosting account
- [ ] Set up backup for MongoDB
- [ ] Create admin backup access
- [ ] Document password in password manager
- [ ] Set up error tracking (Sentry, LogRocket)

---

## 7. 🚀 Quick Commands Reference

### Generate SESSION_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Deploy to Vercel:
```bash
vercel --prod
```

### Check Environment Variables:
```bash
vercel env ls
```

### Add Environment Variable:
```bash
vercel env add SESSION_SECRET
```

### View Logs:
```bash
vercel logs
```

---

## 8. 🆘 Troubleshooting

### Issue: "CORS Error"
**Solution:** Add your domain to ALLOWED_ORIGINS
```
ALLOWED_ORIGINS=https://your-actual-domain.vercel.app
```

### Issue: "Cannot Login"
**Solution:** Verify DEFAULT_ADMIN_PASSWORD is set correctly in Vercel environment variables

### Issue: "MongoDB Connection Failed"
**Solution:** 
1. Check MONGODB_URI is correct
2. Verify MongoDB Atlas allows connections from `0.0.0.0/0` (or Vercel IPs)
3. URL-encode special characters in password

### Issue: "Session Not Persisting"
**Solution:** Ensure SESSION_SECRET is set and not changing between requests

---

## 9. 📋 Environment Variables Summary

| Variable | Development | Production | Required |
|----------|-------------|------------|----------|
| `DEFAULT_ADMIN_PASSWORD` | `teatime` | **CHANGE THIS** | ✅ Yes |
| `SESSION_SECRET` | `change-this...` | **GENERATE NEW** | ✅ Yes |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | `https://your-domain.com` | ✅ Yes |
| `MONGODB_URI` | Atlas URI | Atlas URI | ✅ Yes |
| `NODE_ENV` | `development` | `production` | ✅ Yes |
| `PORT` | `3000` | `3000` (auto by Vercel) | ❌ No |

---

## 10. 📱 Testing Your Production Setup

### Manual Testing:
1. Visit `https://your-domain.vercel.app`
2. Check browser shows 🔒 (HTTPS active)
3. Open customer page - submit a booking
4. Login to `/dashboard` with new password
5. Test all CRUD operations
6. Check notifications work
7. Test shop toggle
8. Try filter controls

### Automated Testing:
```bash
# Test HTTPS
curl -I https://your-domain.vercel.app

# Test API endpoint
curl https://your-domain.vercel.app/api/shop-status

# Test CORS (should work from your domain)
curl -H "Origin: https://your-domain.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS https://your-domain.vercel.app/api/bookings
```

---

## ✅ You're Production Ready When:

1. ✅ New password works (not `teatime`)
2. ✅ App accessible via HTTPS
3. ✅ No CORS errors in browser console
4. ✅ All environment variables set
5. ✅ MongoDB connected
6. ✅ Bookings can be created
7. ✅ Dashboard login works
8. ✅ CRUD operations functional

---

**Need Help?** 
- Check [VERCEL-DEPLOY.md](VERCEL-DEPLOY.md) for deployment guide
- Review [SECURITY-REPORT.md](SECURITY-REPORT.md) for security features
- See [MONGODB-SETUP.md](MONGODB-SETUP.md) for database configuration

**Last Updated:** February 3, 2026
