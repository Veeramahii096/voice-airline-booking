# Free Deployment Guide (No Cost!)

## 🆓 Option 1: Render.com (EASIEST - Recommended)

**Cost:** FREE forever (no credit card needed)  
**Time:** 5-10 minutes  
**URL:** yourapp.onrender.com

### Step 1: Push to GitHub
```bash
cd voice-airline-booking

# Initialize git (if not already)
git init
git add .
git commit -m "Initial commit"

# Create repo on GitHub.com, then:
git remote add origin https://github.com/YOUR_USERNAME/voice-airline-booking.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Render
1. Go to [render.com](https://render.com)
2. Sign up with GitHub (free)
3. Click **"New"** → **"Blueprint"**
4. Select your `voice-airline-booking` repository
5. Render will auto-detect `render.yaml` and deploy!
6. Wait 5-10 minutes for build
7. Get your URL: `https://voice-airline-frontend.onrender.com`

✅ **Done!** Your app is live and free!

**Note:** Free tier sleeps after 15 min inactivity, takes ~30 sec to wake up.

---

## 🆓 Option 2: Railway.app

**Cost:** $5 free credit monthly (enough for small app)  
**Time:** 5 minutes  
**URL:** yourapp.railway.app

### Steps:
1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select `voice-airline-booking`
5. Railway auto-detects Docker and deploys
6. Get URL: `https://yourapp.railway.app`

✅ Always on (no sleep)!

---

## 🆓 Option 3: Vercel (Frontend Only)

**Cost:** FREE forever  
**Best for:** Frontend hosting  
**Time:** 2 minutes

### Deploy Frontend Only:
```bash
cd frontend

# Install Vercel CLI
npm i -g vercel

# Login and deploy
vercel login
vercel --prod
```

Gets URL: `https://voice-airline-booking.vercel.app`

**Note:** Backend and NLP need separate hosting (use Render for those)

---

## 🆓 Option 4: Netlify (Frontend Only)

**Cost:** FREE forever  
**Best for:** Static frontend  

### Steps:
1. Go to [netlify.com](https://netlify.com)
2. Sign up free
3. Drag & drop your `frontend/dist` folder
4. Get URL: `https://yourapp.netlify.app`

---

## 🆓 Option 5: Oracle Cloud (Advanced - FREE Forever)

**Cost:** FREE forever (truly free, not trial)  
**Features:** 
- 2 VMs with 1GB RAM each
- Always on, no sleep
- Professional setup

### Steps:
1. Sign up: [oracle.com/cloud/free](https://www.oracle.com/cloud/free/)
2. Create Ubuntu VM instance
3. SSH into VM
4. Install Docker and deploy:
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Clone and deploy
git clone https://github.com/YOUR_USERNAME/voice-airline-booking.git
cd voice-airline-booking
docker-compose up -d --build
```

5. Open port 80 in firewall
6. Access: `http://VM_IP_ADDRESS`

✅ Best free option for always-on hosting!

---

## 🆓 Option 6: Google Cloud Free Tier

**Cost:** $300 credit (valid 90 days) + Always Free tier  
**Features:** Professional cloud hosting

### Steps:
1. Sign up: [cloud.google.com/free](https://cloud.google.com/free)
2. Create VM instance (e2-micro is free)
3. Deploy using SSH and Docker
4. Get static IP
5. Access your app

---

## 📊 Comparison Table

| Provider | Cost | Always On | SSL | Setup Time | Best For |
|----------|------|-----------|-----|------------|----------|
| **Render** | FREE | ❌ (sleeps) | ✅ | 5 min | Beginners |
| **Railway** | $5/month free | ✅ | ✅ | 5 min | Small apps |
| **Vercel** | FREE | ✅ | ✅ | 2 min | Frontend only |
| **Oracle** | FREE forever | ✅ | ✅ | 30 min | Always-on apps |
| **Google Cloud** | $300 credit | ✅ | ✅ | 20 min | Professional |

---

## 🎯 Recommended Path:

### For Beginners (5 minutes):
1. ✅ Use **Render.com**
2. ✅ Push code to GitHub
3. ✅ Deploy Blueprint
4. ✅ Done!

### For Always-On (30 minutes):
1. ✅ Use **Oracle Cloud Free Tier**
2. ✅ Create VM
3. ✅ Deploy with Docker
4. ✅ Get static IP

---

## 🚀 Quick Start: Render Deployment

```bash
# 1. Push to GitHub
git init
git add .
git commit -m "Voice airline booking system"
git remote add origin https://github.com/YOUR_USERNAME/voice-airline-booking.git
git push -u origin main

# 2. Go to render.com
# 3. New → Blueprint
# 4. Select repo
# 5. Deploy!
```

**Your app will be live at:** `https://voice-airline-frontend.onrender.com`

---

## 💡 Tips:

1. **Render free tier sleeps**: First request takes 30 sec to wake up
2. **Keep it active**: Use [UptimeRobot](https://uptimerobot.com) to ping every 5 min (free)
3. **Custom domain**: Add your domain free on Render/Netlify/Vercel
4. **SSL included**: All platforms include free HTTPS

---

## ❓ Need Help?

- **Render issues**: Check build logs in Render dashboard
- **GitHub setup**: Make sure all files are committed
- **Docker issues**: Test locally first with `docker-compose up`

Your voice booking system can be **100% FREE** with Render.com! 🎉
