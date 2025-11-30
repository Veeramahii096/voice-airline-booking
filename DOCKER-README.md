# 🐳 Docker Quick Start

## Voice Airline Booking System - Containerized Deployment

### ⚡ Super Quick Start

**Windows:**
```cmd
docker-start.bat
```

**Mac/Linux:**
```bash
chmod +x docker-start.sh
./docker-start.sh
```

**Or manually:**
```bash
docker-compose up --build -d
```

That's it! Open http://localhost

---

## 📋 Prerequisites

1. **Install Docker Desktop**
   - Windows/Mac: https://www.docker.com/products/docker-desktop
   - Linux: `curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh`

2. **Verify Installation**
   ```bash
   docker --version
   docker-compose --version
   ```

---

## 🚀 Running with Docker

### Start Services
```bash
# Build and start
docker-compose up --build -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

### Access Application
- **Frontend**: http://localhost (port 80)
- **Backend API**: http://localhost:4000
- **Health Check**: http://localhost:4000/api/health

### Stop Services
```bash
docker-compose down
```

---

## 📦 What's Included

### Services
- ✅ **Backend**: Node.js/Express API (port 4000)
- ✅ **Frontend**: React + Nginx (port 80)
- ✅ **Network**: Internal communication
- ✅ **Health Checks**: Auto-recovery

### Features
- 🔄 Auto-restart on failure
- 📊 Health monitoring
- 🌐 Nginx optimized
- 🗜️ Gzip compression
- 🔒 Security headers

---

## 🔧 Common Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View logs
docker-compose logs -f

# Rebuild images
docker-compose build --no-cache

# Remove everything
docker-compose down -v
```

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :80
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:80 | xargs kill
```

### Cannot Connect
```bash
# Check if containers are running
docker-compose ps

# View logs
docker-compose logs backend
docker-compose logs frontend

# Restart
docker-compose restart
```

### Clean Rebuild
```bash
docker-compose down
docker system prune -a
docker-compose up --build
```

---

## 📖 Full Documentation

See **DOCKER-GUIDE.md** for:
- Detailed configuration
- Production deployment
- Advanced usage
- Security best practices
- Performance optimization

---

## ✅ Verify Deployment

```bash
# Check backend
curl http://localhost:4000/api/health

# Check frontend
curl http://localhost/

# View container status
docker-compose ps

# Expected: All containers "Up (healthy)"
```

---

## 🎯 Next Steps

1. ✅ Run `docker-compose up -d`
2. ✅ Open http://localhost
3. ✅ Test voice booking flow
4. ✅ Check logs: `docker-compose logs -f`

---

**Fully Containerized** | **Production Ready** | **Easy to Deploy**
