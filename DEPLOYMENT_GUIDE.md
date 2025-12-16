# BookMyShow Clone - Deployment Guide

Complete setup and deployment guide for running the BookMyShow clone on a different laptop with cloud deployment.

## 📋 Prerequisites

### System Requirements
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 9.0.0 or higher (comes with Node.js)
- **Git**: Latest version for code management
- **Code Editor**: VS Code (recommended) or any preferred editor

### Cloud Accounts Required
- **Railway**: For backend and MySQL database hosting (includes $5/month free credits)
- **Vercel**: For frontend deployment  
- **GitHub**: For code repository (if not already available)

> **Note**: Railway's free tier provides $5 in monthly credits, which is sufficient for small learning projects. Monitor your usage in the Railway dashboard.

## 🚀 Step-by-Step Setup Guide

### Step 1: System Setup on New Laptop

#### 1.1 Install Node.js
```bash
# Download and install from https://nodejs.org/
# Verify installation
node --version  # Should show v18.0.0 or higher
npm --version   # Should show v9.0.0 or higher
```

#### 1.2 Install Git
```bash
# Download from https://git-scm.com/
# Verify installation
git --version
```

#### 1.3 Install Code Editor (Optional)
```bash
# Download VS Code from https://code.visualstudio.com/
```

### Step 2: Get Project Code

#### 2.1 Clone Repository (if using Git)
```bash
# If code is in a Git repository
git clone <repository-url>
cd BookMyShow

# Or download and extract project files to a folder
```

#### 2.2 Verify Project Structure
```
BookMyShow/
├── backend/
│   ├── src/
│   ├── package.json
│   ├── .env.example
│   └── README.md
├── frontend/
│   ├── src/
│   ├── package.json
│   ├── vite.config.ts
│   └── index.html
├── deployment/
│   ├── docker/
│   ├── railway/
│   └── vercel/
├── PROJECT_SUMMARY.md
└── DEPLOYMENT_GUIDE.md
```

## 🗄️ Database Setup (Railway MySQL)

### Step 3: Create Railway MySQL Database

Railway makes it incredibly easy to provision a production-ready MySQL database. You'll create both your database and backend in the same Railway project.

#### 3.1 Create Railway Account
1. Go to https://railway.app/
2. Click "Login" and sign in with your GitHub account
3. Authorize Railway to access your GitHub account
4. You'll receive $5 in free credits monthly for your projects

#### 3.2 Create New Project
1. Once logged in, click "New Project" on the dashboard
2. You'll see options to deploy from GitHub or provision databases
3. Keep this window open - we'll add both database and backend to this project

#### 3.3 Provision MySQL Database
1. In your new project, click "New" → "Database" → "Add MySQL"
2. Railway will automatically provision a MySQL 8.0 database
3. Wait 30-60 seconds for the database to be ready (you'll see a green checkmark)
4. Your database is now running and ready to use!

#### 3.4 Access Database Credentials

Railway automatically generates all necessary environment variables for your MySQL database:

1. Click on the MySQL service in your Railway project
2. Go to the "Variables" tab
3. You'll see these auto-generated variables:

```env
MYSQLHOST=containers-us-west-xxx.railway.app
MYSQLPORT=6379
MYSQLDATABASE=railway
MYSQLUSER=root
MYSQLPASSWORD=xxxxxxxxxxxx
MYSQL_URL=mysql://root:xxxxxxxxxxxx@containers-us-west-xxx.railway.app:6379/railway
```

> **Important**: These variables are automatically available to all services in the same Railway project. You don't need to copy them manually when deploying your backend in the same project.

#### 3.5 Connect to Database (Optional - For Direct Access)

You can connect to your Railway MySQL database using the Railway CLI or any MySQL client:

**Option A: Using Railway CLI**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Connect to MySQL database
railway connect MySQL
```

**Option B: Using MySQL Client**
```bash
# Using the connection URL from Railway
mysql -h containers-us-west-xxx.railway.app \
  -P 6379 \
  -u root \
  -p railway

# Or using the MYSQL_URL directly
mysql mysql://root:password@host:port/railway
```

**Option C: Using MySQL Workbench or DBeaver**
1. Copy the connection details from Railway Variables tab
2. Create a new connection in your MySQL client
3. Use the following details:
   - **Host**: Value of `MYSQLHOST`
   - **Port**: Value of `MYSQLPORT`
   - **Database**: Value of `MYSQLDATABASE`
   - **Username**: Value of `MYSQLUSER`
   - **Password**: Value of `MYSQLPASSWORD`

#### 3.6 Initialize Database Schema

Your backend application should handle database schema initialization automatically when it starts. However, if you need to manually create tables:

**Method 1: Using your backend's migration scripts**
```bash
# After deploying backend (covered in next section)
# Your app should auto-create tables on first run
```

**Method 2: Manual SQL execution**
```bash
# Connect via Railway CLI
railway connect MySQL

# Then run your SQL commands
CREATE TABLE IF NOT EXISTS movies (...);
CREATE TABLE IF NOT EXISTS theaters (...);
-- etc.
```

#### 3.7 Understanding Railway MySQL Variables

When you deploy your backend to the same Railway project, you can reference these MySQL variables using Railway's template syntax:

- **Reference variable**: `${{MySQL.MYSQL_URL}}` - This automatically uses the database URL
- **Individual variables**: `${{MySQL.MYSQLHOST}}`, `${{MySQL.MYSQLPORT}}`, etc.

This means you don't need to hardcode any database credentials - Railway handles everything automatically!

## 🖥️ Backend Deployment (Railway)

Now that your MySQL database is set up, let's deploy your backend application to the same Railway project.

### Step 4: Deploy Backend to Railway

#### 4.1 Prepare Your Backend Code

Before deploying, ensure your backend code is ready:

1. Navigate to your backend folder locally:
```bash
cd backend
```

2. Verify your `package.json` has the correct start script:
```json
{
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

3. Ensure your database connection code can read from environment variables (DATABASE_URL or individual variables)

#### 4.2 Deploy Backend - Method 1: GitHub Integration (Recommended)

This method automatically deploys your backend whenever you push to GitHub.

**Step 1: Push code to GitHub**
```bash
# If not already a git repository
git init
git add .
git commit -m "Initial commit"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/yourusername/BookMyShow.git
git branch -M main
git push -u origin main
```

**Step 2: Deploy from GitHub in Railway**
1. Go to your Railway project (where you created the MySQL database)
2. Click "New" → "GitHub Repo"
3. Select your BookMyShow repository
4. Railway will detect it's a monorepo and ask for the root directory
5. Set **Root Directory** to: `backend`
6. Click "Deploy"

**Step 3: Wait for deployment**
- Railway will automatically:
  - Install dependencies (`npm install`)
  - Build your app (if needed)
  - Start your app using the `start` script
- Watch the deployment logs in real-time
- Deployment typically takes 2-5 minutes

#### 4.3 Deploy Backend - Method 2: Railway CLI

Deploy directly from your local machine using the Railway CLI.

```bash
# Navigate to backend folder
cd backend

# Install Railway CLI (if not already installed)
npm install -g @railway/cli

# Login to Railway
railway login

# Link to your existing project
railway link
# Select the project where you created the MySQL database

# Deploy the backend
railway up

# Your backend is now deployed!
```

#### 4.4 Configure Environment Variables

After deployment, you need to set environment variables for your backend service.

**Step 1: Access environment variables**
1. In Railway dashboard, click on your **backend service** (not the MySQL service)
2. Go to the "Variables" tab
3. Click "New Variable"

**Step 2: Add required variables**

```env
# Database Configuration - Using Railway Variable References
DATABASE_URL=${{MySQL.MYSQL_URL}}

# Alternative: Use individual variables
DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=${{MySQL.MYSQLPORT}}
DB_NAME=${{MySQL.MYSQLDATABASE}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}

# Server Configuration  
NODE_ENV=production
PORT=3000

# Session Configuration
SESSION_SECRET=your-super-secret-session-key-production-change-this

# CORS Configuration (Update after deploying frontend)
FRONTEND_URL=https://your-vercel-app.vercel.app

# Application Configuration
API_VERSION=v1
LOG_LEVEL=info

# Seat Blocking Configuration
SEAT_BLOCK_DURATION_MINUTES=5
```

> **Important Notes:**
> - The `${{MySQL.MYSQL_URL}}` syntax automatically references your MySQL database's connection URL
> - Railway will automatically restart your backend after you add/change variables
> - Never commit sensitive values like SESSION_SECRET to your repository
> - Update `FRONTEND_URL` after deploying your frontend (Step 8)

**Step 3: Generate a secure SESSION_SECRET**
```bash
# Generate a random secret (use this value for SESSION_SECRET)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### 4.5 Access Your Backend URL

Once deployed, Railway generates a public URL for your backend:

1. Click on your backend service in Railway
2. Go to "Settings" → "Networking"
3. Click "Generate Domain"
4. You'll get a URL like: `https://bookmyshow-backend-production.up.railway.app`
5. Save this URL - you'll need it for:
   - Frontend API configuration
   - Testing your API endpoints

#### 4.6 Verify Backend Deployment

Test your backend to ensure it's working correctly:

```bash
# Check health endpoint
curl https://your-backend.up.railway.app/health

# Expected response:
# {"status":"ok","timestamp":"2024-12-16T13:00:00.000Z"}

# Test API endpoint (if available)
curl https://your-backend.up.railway.app/api/v1/movies

# Check database connection
# Your backend logs should show successful database connection
```

**View Deployment Logs:**
1. Click on your backend service in Railway
2. Go to "Deployments" tab
3. Click on the latest deployment
4. View logs to check for errors

#### 4.7 Configure Build Settings (Optional)

If you need custom build settings:

1. Create `railway.toml` in your backend folder:

```toml
[build]
builder = "nixpacks"
buildCommand = "npm install"

[deploy]
startCommand = "npm start"
healthcheckPath = "/health"
healthcheckTimeout = 100
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 10

[environment]
NODE_ENV = "production"
```

2. Commit and push this file to trigger a new deployment with these settings

#### 4.8 Enable Auto-Deploy (GitHub Integration)

If you deployed via GitHub:

1. Go to backend service → "Settings" → "Service"
2. Ensure "Auto-Deploy" is enabled
3. Now every push to your main branch will automatically deploy
4. View deployment status in Railway dashboard or through GitHub checks

## 🌐 Frontend Deployment (Vercel)

### Step 5: Prepare Frontend for Deployment

#### 5.1 Create Vercel Account
1. Go to https://vercel.com/
2. Sign up with GitHub
3. Import project from GitHub

#### 5.2 Vercel Configuration File
Create `vercel.json` in frontend folder:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://your-railway-app.railway.app/api/$1"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options", 
          "value": "nosniff"
        }
      ]
    }
  ]
}
```

#### 5.3 Environment Variables for Vercel
```env
# API Configuration
VITE_API_BASE_URL=https://your-railway-app.railway.app/api/v1
VITE_APP_NAME=BookMyShow Clone
VITE_APP_VERSION=1.0.0
```

#### 5.4 Update Frontend Configuration
Update `vite.config.ts`:

```typescript
export default defineConfig({
  // ... existing config
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          mui: ['@mui/material', '@mui/icons-material'],
          utils: ['axios', 'date-fns']
        }
      }
    }
  }
});
```

## 🐳 Docker Setup (Optional Local Development)

### Step 6: Docker Configuration

#### 6.1 Backend Dockerfile
Create `Dockerfile` in backend folder:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["npm", "start"]
```

#### 6.2 Frontend Dockerfile
Create `Dockerfile` in frontend folder:

```dockerfile
# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy build files
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### 6.3 Docker Compose

> **Note**: This Docker Compose setup is for **local development only**. For production deployment, use Railway MySQL as described in Step 3 above.

Create `docker-compose.yml` in root folder:

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: bookmyshow_db
      MYSQL_USER: bookuser
      MYSQL_PASSWORD: bookpass
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      timeout: 20s
      retries: 10

  backend:
    build: 
      context: ./backend
    environment:
      DB_HOST: mysql
      DB_PORT: 3306
      DB_NAME: bookmyshow_db
      DB_USER: bookuser
      DB_PASSWORD: bookpass
      NODE_ENV: development
      SESSION_SECRET: local-dev-secret
      FRONTEND_URL: http://localhost:3001
    ports:
      - "3000:3000"
    depends_on:
      mysql:
        condition: service_healthy
    volumes:
      - ./backend:/app
      - /app/node_modules

  frontend:
    build:
      context: ./frontend
    environment:
      VITE_API_BASE_URL: http://localhost:3000/api/v1
    ports:
      - "3001:80"
    depends_on:
      - backend

volumes:
  mysql_data:
```

**To run locally with Docker:**
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes (clear database)
docker-compose down -v
```

## 🚀 Deployment Process

### Step 7: Complete Backend Deployment Checklist

By now, you should have completed Steps 3 and 4 above. Here's a quick checklist:

- ✅ Railway account created
- ✅ Railway project created
- ✅ MySQL database provisioned in Railway
- ✅ Backend deployed to Railway (via GitHub or CLI)
- ✅ Environment variables configured
- ✅ Backend URL generated and tested

If you haven't completed these steps, go back to **Step 3** and **Step 4** above.

**Quick verification:**
```bash
# Test your backend is live
curl https://your-backend.up.railway.app/health

# Should return: {"status":"ok"}
```

### Step 8: Deploy Frontend to Vercel

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Test build locally
npm run build
npm run preview

# Deploy to Vercel (using Vercel CLI)
npm install -g vercel
vercel login
vercel --prod

# Or deploy via GitHub integration in Vercel dashboard
```

### Step 9: Configure Domain and SSL

#### 9.1 Railway Domain Setup
1. Go to Railway project dashboard
2. Click on "Settings" → "Domains"
3. Add custom domain or use Railway subdomain
4. Note the backend URL for frontend configuration

#### 9.2 Vercel Domain Setup  
1. Go to Vercel project dashboard
2. Click on "Settings" → "Domains"
3. Add custom domain or use Vercel subdomain
4. Update Railway CORS settings with frontend URL

## 🧪 Testing Deployment

### Step 10: Verify Deployment

#### 10.1 Test Backend API
```bash
# Check health endpoint
curl https://your-backend.railway.app/health

# Test movies endpoint
curl https://your-backend.railway.app/api/v1/movies
```

#### 10.2 Test Frontend
1. Open frontend URL in browser
2. Check if movies load properly
3. Test seat selection flow
4. Verify booking creation

#### 10.3 Check Database Connection

You can verify your Railway MySQL database is properly connected to your backend:

**Method 1: Check Backend Logs**
```bash
# View Railway backend logs
railway logs

# Look for messages like:
# "Database connected successfully"
# "MySQL connection established"
```

**Method 2: Connect via Railway CLI**
```bash
# Connect to Railway MySQL database directly
railway connect MySQL

# Once connected, run queries:
SHOW DATABASES;
USE railway;
SHOW TABLES;
SELECT COUNT(*) FROM movies;
SELECT COUNT(*) FROM bookings;
```

**Method 3: Using MySQL Client**
```bash
# Get connection details from Railway Variables tab
# Then connect using mysql client:

mysql -h <MYSQLHOST> -P <MYSQLPORT> -u <MYSQLUSER> -p<MYSQLPASSWORD> <MYSQLDATABASE>

# Or use the connection URL:
mysql <MYSQL_URL>
```

**Method 4: Test via API**
```bash
# If your backend has a database test endpoint
curl https://your-backend.up.railway.app/api/v1/health/db

# Or check if data is being fetched correctly
curl https://your-backend.up.railway.app/api/v1/movies
```

## 🔧 Troubleshooting

### Common Issues

#### Database Connection Issues

**Problem: Backend can't connect to MySQL database**

```bash
# Solution 1: Verify environment variables are set correctly
# In Railway dashboard -> Backend service -> Variables
# Check that DATABASE_URL or individual DB variables are set

# Solution 2: Ensure both services are in the same Railway project
# Backend should use: DATABASE_URL=${{MySQL.MYSQL_URL}}

# Solution 3: Check Railway MySQL service status
# Go to Railway dashboard -> MySQL service
# Ensure it shows a green checkmark (running)

# Solution 4: Review backend deployment logs
railway logs
# Look for error messages like:
# - "ECONNREFUSED" - MySQL service not running
# - "Access denied" - Wrong credentials
# - "Unknown database" - Database name mismatch
```

**Problem: "ER_NOT_SUPPORTED_AUTH_MODE" error**

This occurs when MySQL client doesn't support the authentication method:

```bash
# Solution: Update your MySQL connection configuration
# In your backend code, update the connection options:

mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  authPlugins: {
    mysql_clear_password: () => () => Buffer.from(process.env.DB_PASSWORD + '\0')
  }
})
```

**Problem: Connection timeout or slow queries**

```bash
# Check Railway MySQL service resource usage
# Railway dashboard -> MySQL service -> Metrics
# If using too much memory/CPU, consider:
# 1. Optimizing your queries
# 2. Adding database indexes
# 3. Upgrading Railway plan for more resources
```

#### CORS Errors
```bash
# Update Railway environment variables
FRONTEND_URL=https://your-frontend.vercel.app

# Update Vercel environment variables  
VITE_API_BASE_URL=https://your-backend.railway.app/api/v1
```

#### Build Failures
```bash
# Check Node.js version compatibility
# Verify all dependencies are installed
# Review build logs for specific errors
```

### Monitoring and Logs

#### Railway Logs
```bash
# View logs in Railway dashboard
# Or use Railway CLI
railway logs

# View specific service logs
railway logs backend
```

#### Vercel Logs
```bash
# View build and function logs in Vercel dashboard
# Or use Vercel CLI
vercel logs
```

## 📊 Post-Deployment Checklist

### ✅ Verification Steps

- [ ] Backend health check returns 200
- [ ] Database connection successful
- [ ] Frontend loads without errors
- [ ] API endpoints respond correctly
- [ ] CORS configured properly
- [ ] Environment variables set
- [ ] SSL certificates active
- [ ] Custom domains working (if configured)
- [ ] Seat booking flow functional
- [ ] Error handling working
- [ ] Logging operational

### 🔐 Security Checklist

- [ ] Environment variables secured
- [ ] Database access restricted
- [ ] API rate limiting enabled
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Input validation working
- [ ] Session management secure

## 📞 Support Resources

- **Railway Documentation**: https://docs.railway.app/
  - **MySQL Guide**: https://docs.railway.app/databases/mysql
  - **Environment Variables**: https://docs.railway.app/develop/variables
- **Vercel Documentation**: https://vercel.com/docs
- **Node.js Documentation**: https://nodejs.org/docs/
- **React Documentation**: https://react.dev/
- **MySQL Documentation**: https://dev.mysql.com/doc/

## 🎉 Congratulations!

Your BookMyShow clone is now deployed and running in the cloud! You can share the frontend URL with others to demonstrate your full-stack application.

### Production URLs
- **Frontend**: https://your-app.vercel.app
- **Backend API**: https://your-api.railway.app/api/v1
- **Health Check**: https://your-api.railway.app/health

---

*This deployment guide ensures your application is production-ready with proper cloud infrastructure, monitoring, and security configurations.*