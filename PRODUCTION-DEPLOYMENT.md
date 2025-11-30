# Production Deployment Guide

## Prerequisites
- Ubuntu/Linux server with Docker installed
- Domain name (optional but recommended)
- SSL certificate (Let's Encrypt - free)

## Option 1: Deploy to DigitalOcean (Easiest)

### Step 1: Create Droplet
1. Go to [DigitalOcean](https://digitalocean.com)
2. Create a new Droplet
   - **Image**: Ubuntu 22.04 LTS
   - **Plan**: Basic ($6/month)
   - **Datacenter**: Choose nearest region
3. Add SSH key or use password

### Step 2: Install Docker on Server
```bash
# SSH into your server
ssh root@YOUR_SERVER_IP

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

### Step 3: Upload Code to Server
```bash
# On your local machine
scp -r voice-airline-booking root@YOUR_SERVER_IP:/root/
```

OR clone from GitHub:
```bash
# On server
git clone YOUR_GITHUB_REPO_URL
cd voice-airline-booking
```

### Step 4: Configure Production Environment
```bash
# On server
cd voice-airline-booking

# Update docker-compose.yml ports (if needed)
# Frontend will be on port 80 (accessible via http://YOUR_SERVER_IP)
```

### Step 5: Start Application
```bash
# Build and start containers
docker-compose up -d --build

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### Step 6: Configure Firewall
```bash
# Allow HTTP, HTTPS, SSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp
ufw enable
```

### Step 7: Access Your Application
- Open browser: `http://YOUR_SERVER_IP`
- Application should be running!

---

## Option 2: Deploy to AWS EC2

### Step 1: Launch EC2 Instance
1. Go to AWS Console → EC2
2. Launch Instance
   - **AMI**: Ubuntu Server 22.04 LTS
   - **Instance Type**: t2.small or t2.medium
   - **Security Group**: Allow ports 22, 80, 443

### Step 2: Connect and Install Docker
```bash
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# Install Docker
sudo apt update
sudo apt install -y docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ubuntu
```

### Step 3: Deploy Application
```bash
# Upload code or clone from git
git clone YOUR_REPO
cd voice-airline-booking

# Start services
docker-compose up -d --build
```

---

## Option 3: Deploy to Azure

### Step 1: Create Virtual Machine
1. Azure Portal → Virtual Machines → Create
2. Select Ubuntu 22.04 LTS
3. Size: Standard B2s
4. Allow ports: 22, 80, 443

### Step 2: Install and Deploy
```bash
ssh azureuser@YOUR_AZURE_IP

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Deploy application
git clone YOUR_REPO
cd voice-airline-booking
docker-compose up -d --build
```

---

## Add Domain Name (Optional)

### Step 1: Point Domain to Server
1. Go to your domain registrar (Namecheap, GoDaddy, etc.)
2. Add A record:
   - **Host**: @ (or subdomain like 'booking')
   - **Value**: YOUR_SERVER_IP
   - **TTL**: 300

### Step 2: Install SSL Certificate (HTTPS)
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com
```

### Step 3: Update nginx.conf
Create `nginx-ssl.conf`:
```nginx
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Production Docker Compose (with SSL)

Create `docker-compose.prod.yml`:
```yaml
version: '3.8'

services:
  frontend:
    build: ./frontend
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - backend
      - nlp-service
    restart: always

  backend:
    build: ./backend
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
    restart: always

  nlp-service:
    build: ./nlp-service
    ports:
      - "5000:5000"
    restart: always
```

Start with:
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## Monitoring and Maintenance

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f frontend
docker-compose logs -f backend
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart frontend
```

### Update Application
```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose up -d --build
```

### Backup Data
```bash
# Backup volumes (if using database)
docker-compose down
tar -czf backup-$(date +%Y%m%d).tar.gz voice-airline-booking/
```

---

## Troubleshooting

### Check if containers are running
```bash
docker-compose ps
```

### Check container logs
```bash
docker-compose logs frontend
docker-compose logs backend
docker-compose logs nlp-service
```

### Restart everything
```bash
docker-compose down
docker-compose up -d --build
```

### Check ports
```bash
netstat -tlnp | grep -E '80|443|4000|5000'
```

---

## Cost Estimates

### DigitalOcean
- **Basic Droplet**: $6/month (1 GB RAM, 1 CPU)
- **Standard Droplet**: $12/month (2 GB RAM, 1 CPU) - Recommended

### AWS EC2
- **t2.micro**: Free tier (first year)
- **t2.small**: ~$17/month
- **t2.medium**: ~$34/month

### Azure
- **B1s**: ~$10/month
- **B2s**: ~$40/month

---

## Quick Deploy Script

Save as `deploy.sh`:
```bash
#!/bin/bash

echo "🚀 Deploying Voice Airline Booking..."

# Pull latest code
git pull

# Stop containers
docker-compose down

# Rebuild and start
docker-compose up -d --build

# Show status
docker-compose ps

echo "✅ Deployment complete!"
echo "📊 Access at: http://$(curl -s ifconfig.me)"
```

Make executable:
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## Security Best Practices

1. **Firewall**: Only allow necessary ports (22, 80, 443)
2. **SSL**: Always use HTTPS in production
3. **Updates**: Keep system and Docker updated
4. **Backups**: Regular automated backups
5. **Monitoring**: Set up uptime monitoring (UptimeRobot, Pingdom)
6. **SSH**: Use SSH keys, disable password authentication

---

## Next Steps

1. ✅ Choose hosting provider (DigitalOcean recommended for beginners)
2. ✅ Create server and install Docker
3. ✅ Upload code and deploy
4. ✅ Test application at http://SERVER_IP
5. ✅ (Optional) Add domain and SSL
6. ✅ Set up monitoring and backups

Your voice booking system will be live and accessible worldwide! 🌍
