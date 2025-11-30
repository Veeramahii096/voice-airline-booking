# 🐳 Docker Deployment Guide

## Voice Airline Booking System - Complete Docker Setup

This guide covers deploying both frontend and backend using Docker containers.

---

## 📋 Prerequisites

### Required Software:
- **Docker Desktop** (Windows/Mac) or Docker Engine (Linux)
- **Docker Compose** (included with Docker Desktop)

### Installation:

#### Windows/Mac:
1. Download Docker Desktop: https://www.docker.com/products/docker-desktop
2. Install and start Docker Desktop
3. Verify installation:
```cmd
docker --version
docker-compose --version
```

#### Linux:
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

---

## 🚀 Quick Start (Docker Compose)

### Option 1: One Command Deployment

```bash
# From project root directory
cd c:\Users\Veera\Downloads\voices\voice-airline-booking

# Build and start all services
docker-compose up --build
```

**That's it!** 🎉

- **Frontend**: http://localhost (port 80)
- **Backend API**: http://localhost:4000

### Option 2: Background Mode (Detached)

```bash
# Start in background
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## 📦 What Gets Created

### Docker Images:
1. **voice-airline-backend** - Node.js Express API
2. **voice-airline-frontend** - React app with Nginx

### Docker Containers:
1. **voice-airline-backend** (port 4000)
2. **voice-airline-frontend** (port 80)

### Docker Network:
- **voice-airline-network** - Bridge network for inter-service communication

---

## 🛠️ Docker Commands Reference

### Build and Run:
```bash
# Build images
docker-compose build

# Start services
docker-compose up

# Build and start (fresh build)
docker-compose up --build

# Start in background
docker-compose up -d

# Force recreate containers
docker-compose up --force-recreate
```

### Manage Services:
```bash
# Stop services
docker-compose stop

# Start stopped services
docker-compose start

# Restart services
docker-compose restart

# Stop and remove containers
docker-compose down

# Remove containers, networks, and volumes
docker-compose down -v
```

### View Information:
```bash
# List running containers
docker-compose ps

# View logs (all services)
docker-compose logs

# View logs (specific service)
docker-compose logs backend
docker-compose logs frontend

# Follow logs (real-time)
docker-compose logs -f

# View last 100 lines
docker-compose logs --tail=100
```

### Execute Commands in Containers:
```bash
# Open shell in backend container
docker-compose exec backend sh

# Open shell in frontend container
docker-compose exec frontend sh

# Run npm command in backend
docker-compose exec backend npm --version
```

---

## 🔍 Verify Deployment

### Check Container Status:
```bash
docker-compose ps
```

Expected output:
```
NAME                       STATUS          PORTS
voice-airline-backend      Up (healthy)    0.0.0.0:4000->4000/tcp
voice-airline-frontend     Up (healthy)    0.0.0.0:80->80/tcp
```

### Health Checks:
```bash
# Backend health
curl http://localhost:4000/api/health

# Frontend health
curl http://localhost/health
```

### Test Application:
1. Open browser: http://localhost
2. Should see Voice Airline Booking welcome page
3. Test booking flow

---

## 📁 Docker Configuration Files

### Project Structure:
```
voice-airline-booking/
├── docker-compose.yml          # Orchestrates all services
├── backend/
│   ├── Dockerfile              # Backend image definition
│   └── .dockerignore           # Files to exclude
└── frontend/
    ├── Dockerfile              # Frontend image definition
    ├── nginx.conf              # Nginx configuration
    └── .dockerignore           # Files to exclude
```

### Key Configuration Details:

#### docker-compose.yml:
- Defines 2 services (backend, frontend)
- Maps ports (4000, 80)
- Creates network for communication
- Configures health checks
- Sets restart policies

#### Backend Dockerfile:
- Uses Node.js 18 Alpine (lightweight)
- Installs production dependencies
- Exposes port 4000
- Runs Express server

#### Frontend Dockerfile:
- Multi-stage build (build + production)
- Build stage: Compiles React app
- Production stage: Serves via Nginx
- Optimized for size and performance

---

## 🔧 Customization

### Change Ports:

Edit `docker-compose.yml`:
```yaml
services:
  backend:
    ports:
      - "5000:4000"  # Host:Container
  
  frontend:
    ports:
      - "8080:80"    # Host:Container
```

### Environment Variables:

Create `.env` file in project root:
```env
# Backend port
BACKEND_PORT=4000

# Frontend port
FRONTEND_PORT=80

# Node environment
NODE_ENV=production
```

Update `docker-compose.yml`:
```yaml
services:
  backend:
    ports:
      - "${BACKEND_PORT}:4000"
    environment:
      - NODE_ENV=${NODE_ENV}
```

### Resource Limits:

Add to `docker-compose.yml`:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```

---

## 🐛 Troubleshooting

### Issue: Port Already in Use

**Error**: "port is already allocated"

**Solution**:
```bash
# Windows - Find and kill process
netstat -ano | findstr :80
taskkill /PID <PID> /F

# Or change port in docker-compose.yml
ports:
  - "8080:80"  # Use port 8080 instead
```

### Issue: Build Fails

**Solution**:
```bash
# Clear Docker cache
docker-compose down
docker system prune -a

# Rebuild from scratch
docker-compose build --no-cache
docker-compose up
```

### Issue: Container Exits Immediately

**Check logs**:
```bash
docker-compose logs backend
docker-compose logs frontend
```

**Common causes**:
- Missing dependencies
- Port conflicts
- Configuration errors

### Issue: Cannot Connect to Backend

**Solution**:
```bash
# Check if backend is running
docker-compose ps

# Check backend logs
docker-compose logs backend

# Test backend directly
curl http://localhost:4000/api/health

# Restart backend
docker-compose restart backend
```

### Issue: Changes Not Reflected

**Solution**:
```bash
# Rebuild and restart
docker-compose down
docker-compose up --build

# Or force recreate
docker-compose up --force-recreate
```

---

## 📊 Monitoring

### View Resource Usage:
```bash
# Real-time stats
docker stats

# Specific container
docker stats voice-airline-backend
```

### Container Logs:
```bash
# All logs
docker-compose logs

# Since 1 hour ago
docker-compose logs --since 1h

# Last 50 lines, follow
docker-compose logs --tail=50 -f
```

### Inspect Containers:
```bash
# Backend details
docker inspect voice-airline-backend

# Network details
docker network inspect voice-airline-booking_voice-airline-network
```

---

## 🚀 Production Deployment

### AWS EC2 / DigitalOcean:

```bash
# Install Docker on server
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Clone/upload your project
cd /opt
git clone <your-repo>
cd voice-airline-booking

# Start services
docker-compose up -d

# Setup SSL (optional - using Let's Encrypt)
# Install certbot and configure nginx for HTTPS
```

### Using Docker Hub:

```bash
# Build and tag images
docker build -t yourusername/voice-airline-backend:latest ./backend
docker build -t yourusername/voice-airline-frontend:latest ./frontend

# Push to Docker Hub
docker login
docker push yourusername/voice-airline-backend:latest
docker push yourusername/voice-airline-frontend:latest

# On production server
docker pull yourusername/voice-airline-backend:latest
docker pull yourusername/voice-airline-frontend:latest
docker-compose up -d
```

### Kubernetes Deployment:

Create `k8s-deployment.yml`:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: voice-airline-backend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: yourusername/voice-airline-backend:latest
        ports:
        - containerPort: 4000
---
apiVersion: v1
kind: Service
metadata:
  name: backend-service
spec:
  selector:
    app: backend
  ports:
  - port: 4000
    targetPort: 4000
  type: LoadBalancer
```

---

## 🔒 Security Best Practices

### 1. Use Secrets for Sensitive Data:
```yaml
# docker-compose.yml
services:
  backend:
    secrets:
      - db_password
      - api_key

secrets:
  db_password:
    file: ./secrets/db_password.txt
  api_key:
    file: ./secrets/api_key.txt
```

### 2. Run as Non-Root User:
```dockerfile
# In Dockerfile
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs
```

### 3. Scan for Vulnerabilities:
```bash
docker scan voice-airline-backend
docker scan voice-airline-frontend
```

### 4. Keep Images Updated:
```bash
# Update base images regularly
docker-compose pull
docker-compose up -d
```

---

## 📈 Performance Optimization

### 1. Multi-Stage Builds:
Already implemented in frontend Dockerfile

### 2. Layer Caching:
Order Dockerfile commands from least to most frequently changing

### 3. Minimize Image Size:
- Use Alpine base images
- Remove unnecessary dependencies
- Use `.dockerignore`

### 4. Enable Gzip:
Already configured in `nginx.conf`

---

## 🧪 Testing Docker Setup

### Local Testing:
```bash
# Start services
docker-compose up -d

# Run tests
curl http://localhost:4000/api/health
curl http://localhost/

# Complete booking flow
# Open browser: http://localhost
# Test voice features
# Complete payment with OTP: 123456

# Stop services
docker-compose down
```

### Automated Testing:
```bash
# Create test script
cat > test-docker.sh << 'EOF'
#!/bin/bash
echo "Testing backend..."
curl -f http://localhost:4000/api/health || exit 1

echo "Testing frontend..."
curl -f http://localhost/ || exit 1

echo "All tests passed!"
EOF

chmod +x test-docker.sh
./test-docker.sh
```

---

## 📝 Maintenance

### Update Application:
```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose down
docker-compose up --build -d
```

### Backup Data:
```bash
# Export container
docker export voice-airline-backend > backend-backup.tar

# Save image
docker save voice-airline-backend > backend-image.tar
```

### Clean Up:
```bash
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune

# Remove all unused resources
docker system prune -a
```

---

## 🎯 Quick Command Reference

| Task | Command |
|------|---------|
| Start all services | `docker-compose up -d` |
| Stop all services | `docker-compose down` |
| View logs | `docker-compose logs -f` |
| Rebuild | `docker-compose up --build` |
| Restart service | `docker-compose restart backend` |
| Shell access | `docker-compose exec backend sh` |
| Check status | `docker-compose ps` |
| View stats | `docker stats` |

---

## ✅ Deployment Checklist

- [ ] Docker Desktop installed and running
- [ ] Project files in place
- [ ] `.env.production` configured (if needed)
- [ ] Ports 80 and 4000 available
- [ ] Run `docker-compose up --build`
- [ ] Verify http://localhost works
- [ ] Test booking flow
- [ ] Check health endpoints
- [ ] Monitor logs for errors

---

## 🎉 Success!

Your Voice Airline Booking System is now running in Docker containers!

- **Frontend**: http://localhost
- **Backend**: http://localhost:4000
- **Containerized**: ✅
- **Production Ready**: ✅
- **Easy to Scale**: ✅

For production deployment with SSL, database, and monitoring, see PRODUCTION.md.

---

**Built with Docker 🐳 | Optimized for Performance | Ready to Scale**
