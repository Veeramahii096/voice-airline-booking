# 🚀 Complete Deployment Guide

## Voice Airline Booking System - All Deployment Methods

---

## 📋 Available Deployment Options

### 1️⃣ Docker Deployment (Recommended) 🐳
**Best for:** Production, Scalability, Easy Management

**Quick Start:**
```bash
# Windows
docker-start.bat

# Mac/Linux
./docker-start.sh

# Or manually
docker-compose up --build -d
```

**Access:**
- Frontend: http://localhost
- Backend: http://localhost:4000

**Pros:**
- ✅ Isolated environment
- ✅ Easy scaling
- ✅ Production-ready
- ✅ Consistent across systems
- ✅ Auto-restart on failure

**Documentation:** See `DOCKER-README.md` and `DOCKER-GUIDE.md`

---

### 2️⃣ Local Development (npm)
**Best for:** Development, Testing, Debugging

**Start Backend:**
```bash
cd backend
npm install
npm start
```

**Start Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Access:**
- Frontend: http://localhost:5173
- Backend: http://localhost:4000

**Pros:**
- ✅ Fast development cycle
- ✅ Hot module reloading
- ✅ Easy debugging
- ✅ No Docker required

**Documentation:** See `QUICKSTART.md`

---

### 3️⃣ Production VPS/Cloud
**Best for:** AWS, DigitalOcean, Azure, Google Cloud

**Using Docker:**
```bash
# On server
git clone <your-repo>
cd voice-airline-booking
docker-compose up -d
```

**Traditional (without Docker):**
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
npm install -g pm2

# Start backend
cd backend
npm install --production
pm2 start server.js --name airline-backend

# Build frontend
cd ../frontend
npm install
npm run build

# Serve with Nginx
sudo cp -r dist/* /var/www/html/
```

**Documentation:** See `PRODUCTION.md`

---

## 🔄 Comparison Table

| Feature | Docker 🐳 | Local npm 💻 | Cloud VPS 🌐 |
|---------|-----------|--------------|--------------|
| **Setup Time** | 5 min | 5 min | 20 min |
| **Isolation** | ✅ Yes | ❌ No | ✅ Yes |
| **Auto-restart** | ✅ Yes | ❌ No | ⚠️ With PM2 |
| **Scalability** | ✅ Easy | ❌ Hard | ✅ Yes |
| **Production** | ✅ Ready | ❌ Dev only | ✅ Ready |
| **Hot Reload** | ❌ No | ✅ Yes | ❌ No |
| **Debugging** | ⚠️ Medium | ✅ Easy | ⚠️ Medium |
| **Resource Use** | Medium | Low | Varies |

---

## 📦 Deployment Methods Detailed

### Docker Deployment Steps

1. **Prerequisites:**
   ```bash
   # Install Docker Desktop
   # Windows/Mac: https://docker.com
   # Linux: curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh
   ```

2. **Deploy:**
   ```bash
   cd voice-airline-booking
   docker-compose up --build -d
   ```

3. **Verify:**
   ```bash
   docker-compose ps
   curl http://localhost/
   ```

4. **Manage:**
   ```bash
   docker-compose logs -f        # View logs
   docker-compose restart        # Restart
   docker-compose down           # Stop
   ```

**Files used:**
- `docker-compose.yml`
- `backend/Dockerfile`
- `frontend/Dockerfile`
- `frontend/nginx.conf`

---

### Local npm Deployment Steps

1. **Prerequisites:**
   ```bash
   node --version  # v16+
   npm --version   # v8+
   ```

2. **Deploy Backend:**
   ```bash
   cd backend
   npm install
   npm start
   ```

3. **Deploy Frontend (new terminal):**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access:**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:4000

**Files used:**
- `backend/package.json`
- `frontend/package.json`
- `frontend/vite.config.js`

---

### Production Cloud Deployment Steps

#### Option A: Docker on Cloud VPS

**On AWS EC2/DigitalOcean/Azure:**
```bash
# 1. Setup server (Ubuntu)
sudo apt update && sudo apt upgrade -y

# 2. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 3. Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 4. Clone project
cd /opt
git clone <your-repo>
cd voice-airline-booking

# 5. Deploy
docker-compose up -d

# 6. Setup SSL (optional)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

#### Option B: Traditional with PM2

**Backend:**
```bash
cd backend
npm install --production
pm2 start server.js --name airline-backend
pm2 save
pm2 startup
```

**Frontend:**
```bash
cd frontend
npm install
npm run build

# Setup Nginx
sudo apt install nginx
sudo cp -r dist/* /var/www/html/

# Configure reverse proxy
sudo nano /etc/nginx/sites-available/default
```

Nginx config:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location /api {
        proxy_pass http://localhost:4000;
    }

    location / {
        root /var/www/html;
        try_files $uri /index.html;
    }
}
```

---

## 🎯 Recommended Deployment by Use Case

### Development & Testing
**Use:** Local npm deployment
```bash
# Terminal 1
cd backend && npm install && npm start

# Terminal 2
cd frontend && npm install && npm run dev
```

### Staging & Demo
**Use:** Docker on local machine
```bash
docker-compose up --build -d
```

### Production
**Use:** Docker on cloud VPS
```bash
# On cloud server
docker-compose up -d
```

### Enterprise/Scale
**Use:** Kubernetes
```bash
kubectl apply -f k8s-deployment.yml
```

---

## 📊 System Requirements

### Docker Deployment
- **RAM:** 2GB minimum, 4GB recommended
- **CPU:** 2 cores minimum
- **Disk:** 2GB free space
- **Docker:** 20.10+
- **Docker Compose:** 2.0+

### Local npm Deployment
- **RAM:** 4GB minimum
- **CPU:** 2 cores
- **Disk:** 1GB free space
- **Node.js:** 16+
- **npm:** 8+

### Production Cloud
- **RAM:** 2-4GB
- **CPU:** 2-4 cores
- **Disk:** 20GB SSD
- **Bandwidth:** 1TB/month
- **OS:** Ubuntu 20.04/22.04

---

## 🔒 Security Considerations

### Docker (Secure by default)
- ✅ Container isolation
- ✅ Network isolation
- ✅ Non-root user in containers
- ⚠️ Add secrets management for production

### Local Development
- ⚠️ Not for production
- ⚠️ No isolation
- ⚠️ Exposed ports

### Cloud Production
- ✅ Add firewall rules
- ✅ Enable HTTPS/SSL
- ✅ Use environment variables
- ✅ Implement rate limiting
- ✅ Add monitoring

---

## 🎨 Quick Command Reference

### Docker Commands
```bash
docker-compose up -d              # Start
docker-compose down               # Stop
docker-compose logs -f            # Logs
docker-compose ps                 # Status
docker-compose restart            # Restart
docker-compose build --no-cache   # Rebuild
```

### npm Commands
```bash
npm install         # Install deps
npm start          # Start backend
npm run dev        # Start frontend (dev)
npm run build      # Build frontend
npm run preview    # Preview build
```

### PM2 Commands (Production)
```bash
pm2 start          # Start app
pm2 stop           # Stop app
pm2 restart        # Restart
pm2 logs           # View logs
pm2 list           # List apps
pm2 monit          # Monitor
```

---

## 📁 Configuration Files

### Docker Deployment
- `docker-compose.yml` - Main orchestration
- `backend/Dockerfile` - Backend image
- `frontend/Dockerfile` - Frontend image
- `frontend/nginx.conf` - Web server config

### Local Development
- `backend/package.json` - Backend deps
- `frontend/package.json` - Frontend deps
- `frontend/vite.config.js` - Build config

### Production
- `PRODUCTION.md` - Detailed guide
- `.env.production` - Environment vars
- `nginx.conf` - Reverse proxy

---

## 🆘 Support & Troubleshooting

### Docker Issues
See: `DOCKER-GUIDE.md` - Troubleshooting section

### Local Development Issues
See: `QUICKSTART.md` - Troubleshooting section

### Production Issues
See: `PRODUCTION.md` - Deployment section

---

## 📚 Documentation Index

1. **DOCKER-README.md** - Docker quick start
2. **DOCKER-GUIDE.md** - Complete Docker guide
3. **QUICKSTART.md** - Local development
4. **PRODUCTION.md** - Production deployment
5. **README.md** - Main documentation
6. **INSTALLATION-GUIDE.md** - Installation help

---

## ✅ Deployment Checklist

### Docker Deployment
- [ ] Docker installed and running
- [ ] Port 80 and 4000 available
- [ ] Run `docker-compose up -d`
- [ ] Verify http://localhost
- [ ] Check `docker-compose ps`

### Local Deployment
- [ ] Node.js 16+ installed
- [ ] Backend on port 4000
- [ ] Frontend on port 5173
- [ ] Both terminals running
- [ ] Test full booking flow

### Production Deployment
- [ ] VPS/Cloud instance ready
- [ ] Domain configured (if needed)
- [ ] Docker installed on server
- [ ] SSL certificate (if needed)
- [ ] Firewall configured
- [ ] Monitoring setup

---

## 🎉 Success Criteria

Your deployment is successful when:
- ✅ Frontend loads at specified URL
- ✅ Backend health check responds
- ✅ Can complete full booking
- ✅ Voice features work
- ✅ OTP verification works (123456)
- ✅ Ticket downloads successfully

---

## 🚀 Getting Started Now

**Choose your deployment method:**

1. **Want it fast?** → Run `docker-start.bat`
2. **Developing?** → See `QUICKSTART.md`
3. **Going live?** → See `PRODUCTION.md`

**All methods work perfectly! Choose what fits your needs.**

---

**Multiple Deployment Options** | **Flexible** | **Production Ready**
