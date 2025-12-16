# BookMyShow Clone - Deployment Guide

Complete setup and deployment guide for running the BookMyShow clone on a different laptop with cloud deployment.

## 📋 Prerequisites

### System Requirements
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 9.0.0 or higher (comes with Node.js)
- **Git**: Latest version for code management
- **Code Editor**: VS Code (recommended) or any preferred editor

### Cloud Accounts Required
- **Railway**: For backend deployment
- **Vercel**: For frontend deployment  
- **PlanetScale**: For MySQL database hosting
- **GitHub**: For code repository (if not already available)

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

## 🗄️ Database Setup (PlanetScale)

### Step 3: Create PlanetScale Database

#### 3.1 Sign up for PlanetScale
1. Go to https://planetscale.com/
2. Create account using GitHub
3. Click "Create database"
4. Database name: `bookmyshow-db`
5. Region: Choose closest to your location

#### 3.2 Get Database Credentials
1. Go to database dashboard
2. Click "Connect" button
3. Select "Node.js"
4. Copy connection string (format: `mysql://username:password@host/database`)

#### 3.3 Initialize Database Schema
```bash
# Install PlanetScale CLI (optional)
curl -fsSL https://github.com/planetscale/cli/releases/latest/download/pscale_linux_amd64.tar.gz | tar xz

# Connect to database
pscale connect bookmyshow-db main

# Or use the connection string directly in your app
```

## 🖥️ Backend Deployment (Railway)

### Step 4: Prepare Backend for Deployment

#### 4.1 Create Railway Account
1. Go to https://railway.app/
2. Sign up with GitHub
3. Create new project
4. Connect GitHub repository (or deploy from local)

#### 4.2 Backend Environment Variables
Create these variables in Railway dashboard:

```env
# Database Configuration (from PlanetScale)
DATABASE_URL=mysql://username:password@host/database?sslaccept=strict

# Server Configuration  
NODE_ENV=production
PORT=3000

# Session Configuration
SESSION_SECRET=your-super-secret-session-key-production

# CORS Configuration
FRONTEND_URL=https://your-vercel-app.vercel.app

# Application Configuration
API_VERSION=v1
LOG_LEVEL=info

# Seat Blocking Configuration
SEAT_BLOCK_DURATION_MINUTES=5
```

#### 4.3 Railway Configuration File
Create `railway.toml` in backend folder:

```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "npm start"
healthcheckPath = "/health"
healthcheckTimeout = 100
restartPolicyType = "on_failure"

[environment]
NODE_ENV = "production"
```

#### 4.4 Update Backend package.json
```json
{
  "scripts": {
    "start": "node src/app.js",
    "build": "echo 'No build step required'",
    "dev": "nodemon src/app.js"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

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

## 🚀 Deployment Process

### Step 7: Deploy Backend to Railway

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Test locally first
cp .env.example .env
# Edit .env with your database URL
npm run dev

# Deploy to Railway (using Railway CLI)
npm install -g @railway/cli
railway login
railway link
railway deploy

# Or deploy via GitHub integration in Railway dashboard
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
```bash
# Connect to PlanetScale database
pscale shell bookmyshow-db main

# Run basic queries
SHOW TABLES;
SELECT COUNT(*) FROM movies;
```

## 🔧 Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check PlanetScale database status
# Verify connection string format
# Ensure SSL is enabled in connection
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
- **Vercel Documentation**: https://vercel.com/docs
- **PlanetScale Documentation**: https://planetscale.com/docs
- **Node.js Documentation**: https://nodejs.org/docs/
- **React Documentation**: https://react.dev/

## 🎉 Congratulations!

Your BookMyShow clone is now deployed and running in the cloud! You can share the frontend URL with others to demonstrate your full-stack application.

### Production URLs
- **Frontend**: https://your-app.vercel.app
- **Backend API**: https://your-api.railway.app/api/v1
- **Health Check**: https://your-api.railway.app/health

---

*This deployment guide ensures your application is production-ready with proper cloud infrastructure, monitoring, and security configurations.*