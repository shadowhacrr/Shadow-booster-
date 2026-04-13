const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== CONFIGURATION ====================
const CONFIG = {
  // FREE API Configuration - No payment needed!
  apiProvider: process.env.API_PROVIDER || 'free',
  
  // RapidAPI (FREE tier available)
  rapidApiKey: process.env.RAPIDAPI_KEY || '',
  rapidApiHost: process.env.RAPIDAPI_HOST || 'tiktok-api6.p.rapidapi.com',
  
  // Alternative FREE APIs
  useMockData: process.env.USE_MOCK_DATA === 'true' || false,
  
  // JSON Database Path
  dbPath: path.join(__dirname, 'data', 'database.json'),
  
  // Cooldown settings
  cooldownSeconds: parseInt(process.env.COOLDOWN_SECONDS) || 60,
  dailyLimitPerIP: parseInt(process.env.DAILY_LIMIT) || 10
};

// ==================== MIDDLEWARE ====================
app.use(helmet());
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // 3 requests per minute
  message: {
    success: false,
    message: 'Please wait before trying again.',
    cooldown: true,
    waitTime: 60
  }
});
app.use('/api/boost', limiter);

// ==================== JSON DATABASE FUNCTIONS ====================

async function readDatabase() {
  try {
    const data = await fs.readFile(CONFIG.dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Database read error:', error);
    return {
      requests: [],
      users: {},
      stats: {
        totalRequests: 0,
        totalFollowers: 0,
        totalLikes: 0,
        totalViews: 0,
        totalShares: 0,
        totalFavorites: 0,
        totalComments: 0
      },
      settings: {
        cooldownSeconds: 60,
        dailyLimitPerIP: 10,
        freeQuantities: {
          followers: 25,
          hearts: 50,
          views: 100,
          shares: 10,
          favorites: 25,
          comments: 5
        }
      }
    };
  }
}

async function writeDatabase(data) {
  try {
    await fs.writeFile(CONFIG.dbPath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Database write error:', error);
    return false;
  }
}

// ==================== FREE TIKTOK API FUNCTIONS ====================

/**
 * FREE: Get TikTok video info using RapidAPI (FREE tier)
 */
async function getVideoInfo(videoUrl) {
  if (!CONFIG.rapidApiKey) {
    return { success: false, message: 'API key not configured' };
  }

  try {
    const options = {
      method: 'GET',
      url: `https://${CONFIG.rapidApiHost}/video/info`,
      params: { url: videoUrl },
      headers: {
        'X-RapidAPI-Key': CONFIG.rapidApiKey,
        'X-RapidAPI-Host': CONFIG.rapidApiHost
      }
    };

    const response = await axios.request(options);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Video info error:', error.message);
    return { success: false, message: error.message };
  }
}

/**
 * FREE: Get TikTok user info
 */
async function getUserInfo(username) {
  if (!CONFIG.rapidApiKey) {
    return { success: false, message: 'API key not configured' };
  }

  try {
    const options = {
      method: 'GET',
      url: `https://${CONFIG.rapidApiHost}/user/info`,
      params: { username: username.replace('@', '') },
      headers: {
        'X-RapidAPI-Key': CONFIG.rapidApiKey,
        'X-RapidAPI-Host': CONFIG.rapidApiHost
      }
    };

    const response = await axios.request(options);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('User info error:', error.message);
    return { success: false, message: error.message };
  }
}

/**
 * FREE: Get trending videos (for content)
 */
async function getTrendingVideos() {
  if (!CONFIG.rapidApiKey) {
    return { success: false, message: 'API key not configured' };
  }

  try {
    const options = {
      method: 'GET',
      url: `https://${CONFIG.rapidApiHost}/feed/list`,
      params: { region: 'US', count: '10' },
      headers: {
        'X-RapidAPI-Key': CONFIG.rapidApiKey,
        'X-RapidAPI-Host': CONFIG.rapidApiHost
      }
    };

    const response = await axios.request(options);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Trending error:', error.message);
    return { success: false, message: error.message };
  }
}

// ==================== HELPER FUNCTIONS ====================

const TIKTOK_PATTERNS = [
  /tiktok\.com\/@[\w.]+\/video\/\d+/,
  /tiktok\.com\/t\/[\w]+/,
  /vm\.tiktok\.com\/[\w]+/,
  /tiktok\.com\/@[\w.]+/,
  /tiktok\.com\/video\/\d+/
];

function isValidTikTokUrl(url) {
  return TIKTOK_PATTERNS.some(pattern => pattern.test(url));
}

function extractUsername(url) {
  const match = url.match(/tiktok\.com\/@([\w.]+)/);
  return match ? match[1] : null;
}

function extractVideoId(url) {
  const match = url.match(/video\/(\d+)/);
  return match ? match[1] : null;
}

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] || 
         req.headers['x-real-ip'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         'unknown';
}

function generateRequestId() {
  return 'SB-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase();
}

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

// ==================== USER MANAGEMENT ====================

async function canUserRequest(ip) {
  const db = await readDatabase();
  const today = getTodayKey();
  const userKey = `${ip}_${today}`;
  
  if (!db.users[userKey]) {
    return { allowed: true, reason: null };
  }
  
  const user = db.users[userKey];
  const now = Date.now();
  const lastRequest = user.lastRequest || 0;
  const cooldownMs = (db.settings?.cooldownSeconds || 60) * 1000;
  
  // Check cooldown
  if (now - lastRequest < cooldownMs) {
    const waitTime = Math.ceil((cooldownMs - (now - lastRequest)) / 1000);
    return { allowed: false, reason: 'cooldown', waitTime };
  }
  
  // Check daily limit
  const dailyCount = user.dailyCount || 0;
  const dailyLimit = db.settings?.dailyLimitPerIP || 10;
  
  if (dailyCount >= dailyLimit) {
    return { allowed: false, reason: 'daily_limit' };
  }
  
  return { allowed: true, reason: null };
}

async function updateUserRequest(ip) {
  const db = await readDatabase();
  const today = getTodayKey();
  const userKey = `${ip}_${today}`;
  
  if (!db.users[userKey]) {
    db.users[userKey] = {
      ip,
      date: today,
      dailyCount: 0,
      lastRequest: 0,
      totalRequests: 0
    };
  }
  
  db.users[userKey].lastRequest = Date.now();
  db.users[userKey].dailyCount = (db.users[userKey].dailyCount || 0) + 1;
  db.users[userKey].totalRequests = (db.users[userKey].totalRequests || 0) + 1;
  
  await writeDatabase(db);
}

// ==================== API ROUTES ====================

/**
 * @route   GET /api/status
 * @desc    Get server status
 */
app.get('/api/status', async (req, res) => {
  const db = await readDatabase();
  
  res.json({
    success: true,
    status: 'online',
    timestamp: new Date().toISOString(),
    api: {
      provider: CONFIG.apiProvider,
      rapidApiConfigured: !!CONFIG.rapidApiKey,
      useMockData: CONFIG.useMockData
    },
    limits: {
      cooldownSeconds: db.settings?.cooldownSeconds || 60,
      dailyLimitPerIP: db.settings?.dailyLimitPerIP || 10
    },
    servers: {
      us: { status: 'online', load: '25%' },
      eu: { status: 'online', load: '32%' },
      as: { status: 'online', load: '45%' }
    }
  });
});

/**
 * @route   GET /api/services
 * @desc    Get available services
 */
app.get('/api/services', async (req, res) => {
  const db = await readDatabase();
  const quantities = db.settings?.freeQuantities || {};
  
  res.json({
    success: true,
    services: [
      { 
        id: 'followers', 
        name: 'TikTok Followers', 
        description: 'Real followers for your profile',
        icon: '👥',
        quantity: quantities.followers || 25,
        status: 'active',
        deliveryTime: '5-10 minutes'
      },
      { 
        id: 'hearts', 
        name: 'TikTok Likes', 
        description: 'Boost your video likes',
        icon: '❤️',
        quantity: quantities.hearts || 50,
        status: 'active',
        deliveryTime: '2-5 minutes'
      },
      { 
        id: 'views', 
        name: 'TikTok Views', 
        description: 'Increase video views',
        icon: '👁️',
        quantity: quantities.views || 100,
        status: 'active',
        deliveryTime: 'Instant'
      },
      { 
        id: 'shares', 
        name: 'TikTok Shares', 
        description: 'Get more video shares',
        icon: '📤',
        quantity: quantities.shares || 10,
        status: 'active',
        deliveryTime: '10-15 minutes'
      },
      { 
        id: 'favorites', 
        name: 'TikTok Favorites', 
        description: 'Add to favorites',
        icon: '⭐',
        quantity: quantities.favorites || 25,
        status: 'active',
        deliveryTime: '5-10 minutes'
      },
      { 
        id: 'comments', 
        name: 'TikTok Comments', 
        description: 'Custom comments on videos',
        icon: '💬',
        quantity: quantities.comments || 5,
        status: 'maintenance',
        deliveryTime: '20-30 minutes'
      }
    ]
  });
});

/**
 * @route   GET /api/stats
 * @desc    Get platform statistics
 */
app.get('/api/stats', async (req, res) => {
  const db = await readDatabase();
  
  // Calculate total users (unique IPs)
  const uniqueUsers = Object.keys(db.users).length;
  
  res.json({
    success: true,
    stats: {
      totalRequests: db.stats?.totalRequests || 0,
      totalFollowers: db.stats?.totalFollowers || 0,
      totalLikes: db.stats?.totalLikes || 0,
      totalViews: db.stats?.totalViews || 0,
      totalShares: db.stats?.totalShares || 0,
      totalFavorites: db.stats?.totalFavorites || 0,
      totalComments: db.stats?.totalComments || 0,
      uniqueUsers: uniqueUsers,
      onlineNow: Math.floor(Math.random() * 200) + 50
    }
  });
});

/**
 * @route   POST /api/boost
 * @desc    Submit boost request - MAIN ENDPOINT
 */
app.post('/api/boost', async (req, res) => {
  try {
    const { url, service } = req.body;
    const clientIp = getClientIp(req);
    
    // Validation
    if (!url || !service) {
      return res.status(400).json({
        success: false,
        message: 'URL and service are required'
      });
    }
    
    if (!isValidTikTokUrl(url)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid TikTok URL'
      });
    }
    
    // Check user limits
    const check = await canUserRequest(clientIp);
    if (!check.allowed) {
      if (check.reason === 'cooldown') {
        return res.status(429).json({
          success: false,
          message: `Please wait ${check.waitTime} seconds`,
          cooldown: true,
          waitTime: check.waitTime
        });
      }
      if (check.reason === 'daily_limit') {
        return res.status(429).json({
          success: false,
          message: 'Daily limit reached. Try again tomorrow.',
          dailyLimit: true
        });
      }
    }
    
    const db = await readDatabase();
    const quantities = db.settings?.freeQuantities || {};
    const quantity = quantities[service] || 25;
    
    const requestId = generateRequestId();
    const username = extractUsername(url);
    const videoId = extractVideoId(url);
    
    // Create request
    const request = {
      id: requestId,
      url,
      username,
      videoId,
      service,
      quantity,
      status: 'processing',
      createdAt: new Date().toISOString(),
      completedAt: null,
      ip: clientIp,
      delivered: 0
    };
    
    // Update database
    db.requests.push(request);
    db.stats = db.stats || {};
    db.stats.totalRequests = (db.stats.totalRequests || 0) + 1;
    
    switch(service) {
      case 'followers':
        db.stats.totalFollowers = (db.stats.totalFollowers || 0) + quantity;
        break;
      case 'hearts':
        db.stats.totalLikes = (db.stats.totalLikes || 0) + quantity;
        break;
      case 'views':
        db.stats.totalViews = (db.stats.totalViews || 0) + quantity;
        break;
      case 'shares':
        db.stats.totalShares = (db.stats.totalShares || 0) + quantity;
        break;
      case 'favorites':
        db.stats.totalFavorites = (db.stats.totalFavorites || 0) + quantity;
        break;
      case 'comments':
        db.stats.totalComments = (db.stats.totalComments || 0) + quantity;
        break;
    }
    
    await writeDatabase(db);
    await updateUserRequest(clientIp);
    
    // Process in background
    processRequest(requestId);
    
    res.json({
      success: true,
      message: 'Request submitted successfully',
      data: {
        requestId,
        service: service.toUpperCase(),
        quantity,
        status: 'processing',
        estimatedTime: '5-15 minutes'
      }
    });
    
  } catch (error) {
    console.error('Boost error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Process request in background
 */
async function processRequest(requestId) {
  const db = await readDatabase();
  const request = db.requests.find(r => r.id === requestId);
  
  if (!request) return;
  
  // Simulate processing with progress updates
  const processingTime = 10000 + Math.random() * 20000; // 10-30 seconds
  
  setTimeout(async () => {
    request.status = 'completed';
    request.completedAt = new Date().toISOString();
    request.delivered = request.quantity;
    await writeDatabase(db);
    console.log(`Request ${requestId} completed`);
  }, processingTime);
}

/**
 * @route   GET /api/boost/:requestId
 * @desc    Get request status
 */
app.get('/api/boost/:requestId', async (req, res) => {
  const db = await readDatabase();
  const request = db.requests.find(r => r.id === req.params.requestId);
  
  if (!request) {
    return res.status(404).json({
      success: false,
      message: 'Request not found'
    });
  }
  
  res.json({
    success: true,
    data: {
      requestId: request.id,
      service: request.service.toUpperCase(),
      quantity: request.quantity,
      delivered: request.delivered || 0,
      status: request.status,
      createdAt: request.createdAt,
      completedAt: request.completedAt
    }
  });
});

/**
 * @route   GET /api/history
 * @desc    Get recent requests
 */
app.get('/api/history', async (req, res) => {
  const db = await readDatabase();
  
  const recentRequests = db.requests
    .slice(-50)
    .reverse()
    .map(r => ({
      id: r.id,
      service: r.service.toUpperCase(),
      username: r.username,
      quantity: r.quantity,
      status: r.status,
      createdAt: r.createdAt
    }));
  
  res.json({
    success: true,
    count: recentRequests.length,
    requests: recentRequests
  });
});

/**
 * @route   POST /api/verify
 * @desc    Verify TikTok URL
 */
app.post('/api/verify', async (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({
      success: false,
      message: 'URL is required'
    });
  }
  
  const isValid = isValidTikTokUrl(url);
  const username = extractUsername(url);
  const videoId = extractVideoId(url);
  
  // If RapidAPI configured, get real info
  let videoInfo = null;
  let userInfo = null;
  
  if (CONFIG.rapidApiKey && isValid) {
    if (videoId) {
      const result = await getVideoInfo(url);
      if (result.success) videoInfo = result.data;
    }
    if (username) {
      const result = await getUserInfo(username);
      if (result.success) userInfo = result.data;
    }
  }
  
  res.json({
    success: true,
    valid: isValid,
    data: {
      url,
      username,
      videoId,
      type: videoId ? 'video' : 'profile',
      videoInfo,
      userInfo
    }
  });
});

/**
 * @route   GET /api/trending
 * @desc    Get trending videos (requires RapidAPI)
 */
app.get('/api/trending', async (req, res) => {
  if (!CONFIG.rapidApiKey) {
    return res.json({
      success: false,
      message: 'RapidAPI key not configured'
    });
  }
  
  const result = await getTrendingVideos();
  res.json(result);
});

/**
 * @route   GET /api/user/limits
 * @desc    Get user's daily limits
 */
app.get('/api/user/limits', async (req, res) => {
  const clientIp = getClientIp(req);
  const db = await readDatabase();
  const today = getTodayKey();
  const userKey = `${clientIp}_${today}`;
  
  const user = db.users[userKey] || {
    dailyCount: 0,
    lastRequest: 0
  };
  
  const dailyLimit = db.settings?.dailyLimitPerIP || 10;
  const remaining = dailyLimit - (user.dailyCount || 0);
  
  res.json({
    success: true,
    data: {
      dailyLimit,
      used: user.dailyCount || 0,
      remaining: Math.max(0, remaining),
      lastRequest: user.lastRequest
    }
  });
});

/**
 * @route   GET /
 * @desc    Serve frontend
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!'
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🚀 SHADOW BOOSTER SERVER STARTED');
  console.log('='.repeat(60));
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log(`📁 Database: ${CONFIG.dbPath}`);
  console.log('='.repeat(60));
  console.log('API Status:');
  console.log(`  RapidAPI: ${CONFIG.rapidApiKey ? '✅ Configured' : '⚠️ Not configured'}`);
  console.log(`  Mock Data: ${CONFIG.useMockData ? '✅ Enabled' : '❌ Disabled'}`);
  console.log('='.repeat(60));
  console.log('Endpoints:');
  console.log('  GET  /api/status');
  console.log('  GET  /api/services');
  console.log('  GET  /api/stats');
  console.log('  POST /api/boost');
  console.log('  GET  /api/boost/:id');
  console.log('  GET  /api/history');
  console.log('  POST /api/verify');
  console.log('  GET  /api/user/limits');
  console.log('='.repeat(60));
});

module.exports = app;
