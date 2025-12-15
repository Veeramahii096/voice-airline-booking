# 🚀 Production Deployment Guide

## Prerequisites

### 1. Get API Keys

#### Flight Data API (Choose one):
- **Amadeus** (Recommended): https://developers.amadeus.com/register
  - Free tier: 2000 calls/month
  - Get `AMADEUS_API_KEY` and `AMADEUS_API_SECRET`
  
- **Skyscanner**: https://rapidapi.com/skyscanner/api/skyscanner-flight-search
  - Get `FLIGHT_API_KEY`

#### Database (Choose one):
- **MongoDB Atlas** (Recommended): https://www.mongodb.com/cloud/atlas/register
  - Free tier: 512MB storage
  - Get `DATABASE_URL` connection string
  
- **PostgreSQL**: Use managed service like ElephantSQL or Supabase

#### Optional Services:
- **Razorpay**: https://dashboard.razorpay.com/signup (for payments)
- **SendGrid**: https://signup.sendgrid.com/ (for email notifications)
- **Twilio**: https://www.twilio.com/try-twilio (for SMS notifications)

---

## Deployment Options

### Option 1: Deploy to Render (Free Tier)

#### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Voice airline booking app - production ready"
git remote add origin https://github.com/YOUR_USERNAME/voice-airline-booking.git
git push -u origin main
```

#### Step 2: Deploy NLP Service
1. Go to https://dashboard.render.com/
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `voice-airline-nlp`
   - **Root Directory**: `nlp-service`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
   - **Environment Variables**:
     ```
     AMADEUS_API_KEY=your_key_here
     AMADEUS_API_SECRET=your_secret_here
     DATABASE_URL=your_mongodb_url
     ```
5. Click "Create Web Service"
6. Copy the service URL (e.g., `https://voice-airline-nlp.onrender.com`)

#### Step 3: Deploy Backend
1. Click "New +" → "Web Service"
2. Configure:
   - **Name**: `voice-airline-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Environment Variables**:
     ```
     NLP_SERVICE_URL=https://voice-airline-nlp.onrender.com
     DATABASE_URL=your_mongodb_url
     ```

#### Step 4: Deploy Frontend
1. Click "New +" → "Static Site"
2. Configure:
   - **Name**: `voice-airline-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **Environment Variables**:
     ```
     VITE_BACKEND_URL=https://voice-airline-backend.onrender.com
     VITE_NLP_URL=https://voice-airline-nlp.onrender.com
     ```

---

### Option 2: Deploy to Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy each service
cd nlp-service
railway up

cd ../backend
railway up

cd ../frontend
railway up
```

Add environment variables in Railway dashboard.

---

### Option 3: Deploy to Vercel + Render

#### Frontend (Vercel):
```bash
npm install -g vercel
cd frontend
vercel
```

#### Backend + NLP (Render): Follow Option 1 steps 2-3

---

## Environment Configuration

### Create `.env` file in each service:

#### nlp-service/.env
```bash
AMADEUS_API_KEY=your_amadeus_key
AMADEUS_API_SECRET=your_amadeus_secret
DATABASE_URL=mongodb+srv://user:pass@cluster.mongodb.net/airline
PORT=5000
```

#### backend/.env
```bash
NLP_SERVICE_URL=https://your-nlp-service.onrender.com
DATABASE_URL=mongodb+srv://user:pass@cluster.mongodb.net/airline
PORT=4000
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

#### frontend/.env
```bash
VITE_BACKEND_URL=https://your-backend.onrender.com
VITE_NLP_URL=https://your-nlp-service.onrender.com
```

---

## Post-Deployment Setup

### 1. Update CORS Origins

Edit `nlp-service/app.py`:
```python
CORS(app, origins=[
    'https://your-frontend.onrender.com',
    'https://your-frontend.vercel.app'
])
```

Edit `backend/server.js`:
```javascript
app.use(cors({
  origin: ['https://your-frontend.onrender.com']
}));
```

### 2. Test Real API Integration

```bash
# Test flight search
curl -X POST https://your-nlp-service.onrender.com/api/flights \
  -H "Content-Type: application/json" \
  -d '{"origin":"DEL","destination":"BOM","date":"2025-12-20","class":"Economy"}'
```

### 3. Monitor Logs

- Render: Dashboard → Service → Logs
- Railway: `railway logs`
- Vercel: Dashboard → Deployments → Function Logs

---

## Cost Estimate (Free Tier)

| Service | Provider | Monthly Cost |
|---------|----------|--------------|
| Frontend Hosting | Vercel/Render | **FREE** |
| Backend API | Render | **FREE** (750 hrs/mo) |
| NLP Service | Render | **FREE** (750 hrs/mo) |
| MongoDB Database | Atlas | **FREE** (512MB) |
| Flight API | Amadeus | **FREE** (2000 calls) |
| **Total** | | **$0/month** |

For production at scale:
- Render Pro: $7/service/month
- MongoDB M10: $57/month
- Amadeus Production: $50/month
- **Total**: ~$150-200/month

---

## Production Checklist

- [ ] API keys configured
- [ ] Database connected
- [ ] CORS origins updated
- [ ] Environment variables set
- [ ] SSL/HTTPS enabled
- [ ] Error monitoring setup
- [ ] Backup strategy configured
- [ ] Rate limiting implemented
- [ ] API authentication added

---

## Troubleshooting

### Issue: "No flights found"
- Check AMADEUS_API_KEY is valid
- Verify IATA codes are correct
- Check API quota limits

### Issue: "Database connection failed"
- Verify DATABASE_URL is correct
- Check MongoDB Atlas whitelist IPs (allow all: 0.0.0.0/0)
- Ensure database user has read/write permissions

### Issue: "CORS errors"
- Update CORS origins in backend and NLP service
- Ensure all URLs use HTTPS

---

## Next Steps

1. **Add Authentication**: Implement JWT-based user auth
2. **Payment Integration**: Complete Razorpay/Stripe integration
3. **Email Confirmations**: Setup SendGrid for booking confirmations
4. **Analytics**: Add Google Analytics or Mixpanel
5. **Caching**: Implement Redis for flight data caching
6. **CDN**: Use Cloudflare for static assets

---

## Support

For deployment issues:
- Render Docs: https://render.com/docs
- Railway Docs: https://docs.railway.app
- Amadeus Support: https://developers.amadeus.com/support
