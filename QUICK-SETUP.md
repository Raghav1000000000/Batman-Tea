# 🚀 Quick Production Setup

## 1. Change Password (Choose One Method):

### Method A: In Dashboard
1. Go to `http://localhost:3000/dashboard`
2. Login with: `teatime`
3. Change password in settings

### Method B: Update .env
```bash
# Edit .env file, change this line:
DEFAULT_ADMIN_PASSWORD=YourNewStrongPassword123!
```

**Example strong passwords:**
- `BatmanTea@2026!`
- `T3a$D3liv3ry#Secure`
- `MyBatm4nT34!2026`

---

## 2. SESSION_SECRET ✅ DONE
Your SESSION_SECRET has been automatically generated and updated in `.env`:
```
✅ SESSION_SECRET=4ac61ae4f6ce510e...
```

**Keep this secret!** Never share or commit to Git.

---

## 3. Configure ALLOWED_ORIGINS

### For Local Development:
```bash
# .env (current)
ALLOWED_ORIGINS=http://localhost:3000
```

### For Production (Vercel):
When you deploy, update in Vercel Dashboard:

1. Go to: **Vercel Dashboard** → **Your Project** → **Settings** → **Environment Variables**
2. Add/Update:
   ```
   Name:  ALLOWED_ORIGINS
   Value: https://your-app-name.vercel.app
   ```

**Example:**
```
ALLOWED_ORIGINS=https://batman-tea.vercel.app,https://batman-tea-git-main.vercel.app
```

---

## 4. HTTPS Setup ✅ AUTOMATIC

### On Vercel (Recommended):
- ✅ **Automatic HTTPS** - Nothing to do!
- ✅ Free SSL certificate
- ✅ Auto-renewal
- Your app gets: `https://your-app.vercel.app` 🔒

---

## 📋 Deployment Checklist

Before deploying to production:

```bash
# 1. Update password in .env
DEFAULT_ADMIN_PASSWORD=YourNewPassword123!

# 2. ✅ SESSION_SECRET already generated

# 3. Commit your code (but NOT .env)
git add .
git commit -m "Production ready"
git push

# 4. Deploy to Vercel
vercel --prod

# 5. Set environment variables in Vercel:
# Go to: Settings → Environment Variables
# Add these:
```

| Variable | Value | Environment |
|----------|-------|-------------|
| `DEFAULT_ADMIN_PASSWORD` | Your new password | Production |
| `SESSION_SECRET` | Copy from your .env | Production |
| `ALLOWED_ORIGINS` | `https://your-app.vercel.app` | Production |
| `MONGODB_URI` | Copy from your .env | Production |
| `NODE_ENV` | `production` | Production |

---

## 🎯 Quick Commands

### Generate New SESSION_SECRET (if needed):
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Deploy to Vercel:
```bash
npm install -g vercel  # First time only
vercel login           # First time only
vercel --prod          # Deploy
```

### Add Env Variable to Vercel:
```bash
vercel env add DEFAULT_ADMIN_PASSWORD
# Then paste your password when prompted
```

---

## ✅ Current Status

| Item | Status | Action Needed |
|------|--------|---------------|
| SESSION_SECRET | ✅ Generated | None - Already updated |
| HTTPS | ✅ Auto (Vercel) | None - Automatic |
| Password | ⚠️ Default | **Change from `teatime`** |
| ALLOWED_ORIGINS | ⚠️ Localhost | **Update when deploying** |

---

## 📚 Full Guide
See [PRODUCTION-SETUP.md](PRODUCTION-SETUP.md) for complete details.

---

**Next Steps:**
1. ✅ SESSION_SECRET - Done!
2. 🔄 Change password from `teatime`
3. 🚀 Deploy to Vercel
4. 🌍 Update ALLOWED_ORIGINS in Vercel
5. ✅ HTTPS - Automatic on Vercel
