# Code Changes Required for Cloud Deployment

## ✅ Current Status
Your code is **almost ready** for cloud deployment! The following files need minimal updates.

---

## 📝 Required Changes

### 1️⃣ Frontend - Update API Configuration

**File:** `frontend/src/services/api.ts`

**Current code (lines 33-38):**
```typescript
const MODE = import.meta.env.MODE;
const API_BASE_URL = MODE === 'development'
  ? '/api/v1' // Use Vite proxy to local backend in development (port 3004)
  : (import.meta.env.VITE_API_BASE_URL || "https://bookmyshow-production-f9f3.up.railway.app/api/v1");
console.log("API BASE URL:", API_BASE_URL, "MODE:", MODE);
const REQUEST_TIMEOUT = 10000; // 10 seconds
```

**Change to:**
```typescript
const MODE = import.meta.env.MODE;
const API_BASE_URL = MODE === 'development'
  ? '/api/v1' // Use Vite proxy to local backend in development (port 3004)
  : (import.meta.env.VITE_API_BASE_URL || "https://your-railway-backend.railway.app/api/v1");
console.log("API BASE URL:", API_BASE_URL, "MODE:", MODE);
const REQUEST_TIMEOUT = 10000; // 10 seconds
```

**Action:**
- Replace `"https://bookmyshow-production-f9f3.up.railway.app/api/v1"` with your actual Railway backend URL after deployment
- Or leave it as-is and set `VITE_API_BASE_URL` environment variable in Vercel (recommended)

---

### 2️⃣ Frontend - Create Environment File

**File:** `frontend/.env` (create new file)

```env
VITE_API_BASE_URL=https://your-railway-backend.railway.app/api/v1
```

**Action:**
- Create this file after deploying backend to Railway
- Replace `your-railway-backend.railway.app` with actual Railway URL
- This file is for local production testing (won't be committed to Git)

---

### 3️⃣ Backend - Create Environment File

**File:** `backend/.env` (create new file if not exists)

```env
# Database Configuration (Railway auto-injects these from MySQL service)
DB_HOST=your-mysql-host.railway.app
DB_PORT=3306
DB_NAME=railway
DB_USER=root
DB_PASSWORD=your-mysql-password

# Server Configuration
PORT=3004
NODE_ENV=production

# CORS Configuration
FRONTEND_URL=https://your-vercel-app.vercel.app
```

**Action:**
- Railway will auto-inject database credentials from MySQL service
- Update `FRONTEND_URL` after deploying frontend to Vercel
- You can set these as environment variables in Railway dashboard instead

---

## ✅ Files Already Configured (No Changes Needed)

### ✓ Backend CORS (`backend/src/app.js`)
Already supports Vercel deployments:
```javascript
origin: function (origin, callback) {
  const allowedOrigins = [
    FRONTEND_URL,
    'http://localhost:3001',
    'http://localhost:3000',
    'http://localhost:5173', // Vite dev server
  ];

  // Check if origin is in allowed list OR is a Vercel preview deployment
  if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
    callback(null, true);
  } else {
    callback(new Error('Not allowed by CORS'));
  }
}
```

### ✓ Database Configuration (`backend/src/config/database.js`)
Already reads from environment variables:
```javascript
host: process.env.DB_HOST || 'localhost',
port: process.env.DB_PORT || 3306,
username: process.env.DB_USER || 'root',
password: process.env.DB_PASSWORD || '',
database: process.env.DB_NAME || 'bookmyshow',
```

### ✓ Frontend Build Configuration
- `vite.config.ts` - Already configured
- `package.json` - Build scripts ready
- `vercel.json` - Deployment config exists

### ✓ Backend Build Configuration
- `package.json` - Has `start` script
- `railway.json` - Deployment config exists

---

## 🚀 Deployment Order

### Step 1: Deploy Backend to Railway
1. Create Railway project
2. Add MySQL database
3. Deploy backend from GitHub repo
4. Set root directory to `backend`
5. Copy the Railway URL (e.g., `bookmyshow-production.up.railway.app`)

### Step 2: Update Frontend API URL
**Option A - In Code:**
Update `frontend/src/services/api.ts` line 36 with your Railway URL

**Option B - In Vercel (Recommended):**
Set environment variable `VITE_API_BASE_URL` in Vercel dashboard

### Step 3: Deploy Frontend to Vercel
1. Import GitHub repo to Vercel
2. Set root directory to `frontend`
3. Add environment variable: `VITE_API_BASE_URL=https://your-railway-backend.railway.app/api/v1`
4. Deploy
5. Copy Vercel URL (e.g., `bookmyshow.vercel.app`)

### Step 4: Update Backend CORS
1. Go to Railway backend service
2. Add environment variable: `FRONTEND_URL=https://bookmyshow.vercel.app`
3. Railway auto-redeploys

---

## 🧪 Testing Deployed App

### 1. Test Backend Health
```bash
curl https://your-railway-backend.railway.app/api/v1/health
```
Expected response:
```json
{"status":"ok","timestamp":"2025-12-30T..."}
```

### 2. Test Frontend
Visit: `https://your-vercel-app.vercel.app`
- Homepage should load with movie posters
- Clicking a movie should show details
- Booking flow should work end-to-end

### 3. Check Browser Console
- Open DevTools → Console
- Look for: `API BASE URL: https://your-railway-backend.railway.app/api/v1`
- No CORS errors should appear

---

## 📋 Quick Reference

### Environment Variables Summary

**Railway (Backend):**
```
PORT=3004
NODE_ENV=production
FRONTEND_URL=https://your-vercel-app.vercel.app
DB_HOST=auto-injected-by-railway
DB_PORT=3306
DB_NAME=railway
DB_USER=root
DB_PASSWORD=auto-injected-by-railway
```

**Vercel (Frontend):**
```
VITE_API_BASE_URL=https://your-railway-backend.railway.app/api/v1
```

### Railway CLI Commands (Optional)
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to project
railway link

# View logs
railway logs

# Add environment variable
railway variables set FRONTEND_URL=https://your-app.vercel.app
```

### Vercel CLI Commands (Optional)
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Add environment variable
vercel env add VITE_API_BASE_URL
```

---

## 🎯 Summary

**Only 2 changes needed:**

1. **Update API URL in frontend** after Railway deployment:
   - Either in `api.ts` line 36
   - Or set `VITE_API_BASE_URL` in Vercel env vars (recommended)

2. **Set FRONTEND_URL in Railway** after Vercel deployment:
   - Add `FRONTEND_URL` environment variable in Railway dashboard

**Everything else is already configured and ready to deploy!**
