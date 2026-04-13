# 🚀 SHADOW BOOSTER v3.0 - COMPLETE FREE SETUP

**100% FREE TikTok Engagement Booster with JSON Database**

✅ No Database Required (JSON Files)  
✅ FREE API Integration  
✅ Modern Beautiful Design  
✅ Completely Free to Use  

---

## 📁 Files Included

```
shadow-booster/
├── index.html          # Beautiful Frontend
├── server.js           # Backend with JSON Database
├── package.json        # Dependencies
├── .env               # Configuration
├── data/
│   └── database.json   # JSON Database (Auto-created)
└── README.md          # This guide
```

---

## ⚡ QUICK START

### Step 1: Install Node.js
Download from: https://nodejs.org/

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Start Server
```bash
npm start
```

### Step 4: Open Browser
Go to: http://localhost:3000

---

## 🔑 FREE API SETUP (Optional but Recommended)

### Get FREE RapidAPI Key:

1. **Go to**: https://rapidapi.com
2. **Create FREE Account**
3. **Search**: "TikTok API"
4. **Subscribe to FREE Plan**
5. **Copy API Key**
6. **Paste in `.env` file**:

```env
RAPIDAPI_KEY=your_actual_api_key_here
```

### Recommended FREE TikTok APIs on RapidAPI:

| API Name | Free Tier | Link |
|----------|-----------|------|
| TikTok API | 100 requests/month | rapidapi.com |
| TikTok Scraper | 50 requests/day | rapidapi.com |
| Social Media Data | 200 requests/month | rapidapi.com |

---

## 🎨 FEATURES

### Frontend:
- ✅ Animated gradient background
- ✅ Floating particles effect
- ✅ Modern glass-morphism design
- ✅ Service selector with icons
- ✅ Real-time progress tracking
- ✅ CAPTCHA verification
- ✅ Cooldown timer
- ✅ Toast notifications
- ✅ Responsive design

### Backend:
- ✅ JSON file database (no MongoDB/MySQL)
- ✅ Rate limiting
- ✅ IP-based tracking
- ✅ Daily limits per user
- ✅ FREE API integration
- ✅ Request history
- ✅ Statistics tracking

---

## 🌐 DEPLOYMENT (FREE)

### Render.com (Recommended)
```bash
# 1. Create account: render.com
# 2. Connect GitHub repo
# 3. Add Environment Variables
# 4. Deploy!
```

### Railway.app
```bash
# 1. Create account: railway.app
# 2. Connect GitHub
# 3. Deploy automatically
```

### Vercel (Frontend Only)
For frontend only deployment to Vercel.

---

## 🔌 API ENDPOINTS

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/status | Server status |
| GET | /api/services | Available services |
| GET | /api/stats | Platform statistics |
| POST | /api/boost | Submit boost request |
| GET | /api/boost/:id | Check request status |
| GET | /api/history | Recent requests |
| POST | /api/verify | Verify TikTok URL |
| GET | /api/user/limits | User daily limits |

---

## 📊 DEFAULT FREE QUANTITIES

| Service | Free Amount |
|---------|-------------|
| Followers | 25 |
| Likes | 50 |
| Views | 100 |
| Shares | 10 |
| Favorites | 25 |
| Comments | 5 |

---

## ⚙️ CONFIGURATION

Edit `.env` file:

```env
# Server
PORT=3000

# RapidAPI (FREE)
RAPIDAPI_KEY=your_key_here

# Limits
COOLDOWN_SECONDS=60      # Wait time between requests
DAILY_LIMIT=10           # Max requests per day per IP

# Free Quantities
# Edit in data/database.json
```

---

## 🗂️ JSON DATABASE STRUCTURE

File: `data/database.json`

```json
{
  "requests": [
    {
      "id": "SB-1234567890-ABC123",
      "url": "https://tiktok.com/@user/video/123",
      "service": "followers",
      "quantity": 25,
      "status": "completed",
      "createdAt": "2025-01-15T10:30:00.000Z",
      "ip": "192.168.1.1"
    }
  ],
  "users": {
    "192.168.1.1_2025-01-15": {
      "dailyCount": 3,
      "lastRequest": 1705312200000
    }
  },
  "stats": {
    "totalRequests": 100,
    "totalFollowers": 2500,
    "totalLikes": 5000
  }
}
```

---

## 💰 MONETIZATION IDEAS

### 1. Upgrade to Paid Packages
Add Stripe/PayPal for paid boosts:

```javascript
// packages in database.json
{
  "packages": [
    { "name": "Starter", "followers": 100, "price": 2 },
    { "name": "Pro", "followers": 500, "price": 8 },
    { "name": "VIP", "followers": 1000, "price": 15 }
  ]
}
```

### 2. Remove Ads with Premium
- Free users see ads
- Premium users get ad-free experience

### 3. Faster Delivery for Premium
- Free: 10-15 minutes
- Premium: Instant delivery

---

## 🔒 SECURITY

1. **Rate Limiting**: 3 requests per minute
2. **Daily Limits**: 10 requests per IP per day
3. **Cooldown**: 60 seconds between requests
4. **CAPTCHA**: Verification required
5. **Helmet**: Security headers enabled

---

## 🐛 TROUBLESHOOTING

### "Cannot find module"
```bash
npm install
```

### "Port already in use"
```bash
# Change port in .env
PORT=3001
```

### Database not saving
```bash
# Create data folder
mkdir data

# Check permissions
chmod 755 data
```

---

## 🚀 NEXT STEPS

1. ✅ Test locally
2. ✅ Get FREE RapidAPI key (optional)
3. ✅ Customize design/colors
4. ✅ Deploy to Render/Railway
5. ✅ Share with friends!

---

## 📞 SUPPORT

For issues:
1. Check console (F12)
2. Verify Node.js version: `node --version`
3. Check all files are present

---

**Enjoy your FREE Shadow Booster! 🎉**
