# Deploy on Netlify + Glitch (100% FREE, No Credit Card)

## ✅ Step 1: Deploy Frontend on Netlify

### 1. Sign Up on Netlify
- Go to: https://app.netlify.com/signup
- Click "Sign up with GitHub"
- Authorize Netlify

### 2. Deploy Site
1. Click **"Add new site"** → **"Import an existing project"**
2. Choose **"GitHub"**
3. Find and select: **voice-airline-booking**
4. Configure build settings:
   ```
   Base directory: frontend
   Build command: npm install && npm run build
   Publish directory: frontend/dist
   ```
5. Click **"Deploy site"**

### 3. Get Your URL
- Wait 2-3 minutes
- Your site will be live at: `https://random-name-123.netlify.app`
- You can change the name in Site settings

✅ **Frontend is now live!**

---

## ✅ Step 2: Deploy Backend on Glitch

### 1. Sign Up on Glitch
- Go to: https://glitch.com
- Click "Sign in with GitHub"

### 2. Create Backend Project
1. Click **"New Project"**
2. Select **"Import from GitHub"**
3. Enter: `https://github.com/Veeramahii096/voice-airline-booking`
4. Wait for import

### 3. Configure Backend
1. In Glitch editor, find the `.env` file or create it
2. Add:
   ```
   PORT=3000
   NODE_ENV=production
   ```

3. Edit `glitch.json` (or create it in project root):
   ```json
   {
     "install": "cd backend && npm install",
     "start": "cd backend && node server.js",
     "watch": {
       "throttle": 1000
     }
   }
   ```

4. Click **"Tools"** → **"Terminal"** and run:
   ```bash
   cd backend && npm install
   refresh
   ```

### 4. Get Backend URL
- Your backend URL: `https://your-project-name.glitch.me`
- Save this URL!

✅ **Backend is now live!**

---

## ✅ Step 3: Deploy NLP Service on Glitch

### 1. Create New Glitch Project
1. Click **"New Project"** again
2. Select **"Import from GitHub"**
3. Enter same repo: `https://github.com/Veeramahii096/voice-airline-booking`

### 2. Configure NLP Service
1. Create `glitch.json`:
   ```json
   {
     "install": "cd nlp-service && pip install -r requirements.txt",
     "start": "cd nlp-service && python app.py"
   }
   ```

2. In Terminal:
   ```bash
   cd nlp-service
   pip install -r requirements.txt
   refresh
   ```

### 3. Get NLP URL
- Your NLP URL: `https://your-nlp-project.glitch.me`
- Save this URL!

✅ **NLP Service is now live!**

---

## ✅ Step 4: Connect Everything

### Update Frontend Environment Variables

1. Go back to **Netlify Dashboard**
2. Click your site → **"Site settings"** → **"Environment variables"**
3. Add:
   ```
   VITE_API_URL = https://your-backend-project.glitch.me/api
   VITE_NLP_URL = https://your-nlp-project.glitch.me
   ```

4. Click **"Deploys"** → **"Trigger deploy"** → **"Deploy site"**

---

## 🎉 Your App is Live!

**Access your app at:**
- Frontend: `https://your-site.netlify.app`
- Backend: `https://your-backend.glitch.me`
- NLP: `https://your-nlp.glitch.me`

---

## 📝 Important Notes

### Netlify (Frontend)
- ✅ FREE forever
- ✅ Auto-deploys on git push
- ✅ Free SSL certificate
- ✅ Custom domain support

### Glitch (Backend + NLP)
- ✅ FREE forever
- ⚠️ Sleeps after 5 min inactivity
- ⚠️ Wakes up in ~5 seconds on first request
- ✅ No credit card needed

### Keep Glitch Awake (Optional)
Use **UptimeRobot** (free) to ping your Glitch URLs every 5 minutes:
1. Go to: https://uptimerobot.com
2. Add monitors for:
   - `https://your-backend.glitch.me/health`
   - `https://your-nlp.glitch.me/health`

---

## 🔄 Update Your App

### Update Code:
```bash
# Make changes locally
git add .
git commit -m "Updated features"
git push origin main
```

- **Netlify**: Auto-deploys from GitHub
- **Glitch**: Click "Tools" → "Terminal" → `refresh`

---

## ❓ Troubleshooting

### Frontend not loading?
- Check Netlify build logs
- Ensure build command is correct
- Check environment variables

### Backend not responding?
- Check Glitch logs (click "Logs")
- Ensure `glitch.json` is correct
- Try "Tools" → "Terminal" → `refresh`

### CORS errors?
Add to backend `server.js`:
```javascript
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://your-site.netlify.app');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});
```

---

## 🎯 Summary

**Total Cost: $0/month**
**Setup Time: 15-20 minutes**
**Always Available: Yes (with 5 sec wake-up)**

Your voice booking system is now live and accessible worldwide! 🌍
