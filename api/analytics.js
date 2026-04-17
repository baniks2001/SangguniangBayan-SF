/**
 * Analytics Microservice - Track page views, downloads, and user engagement
 * Endpoints: track (POST), stats (GET), popular (GET)
 */

const { connectDB, getDB } = require('./database');
const { ObjectId } = require('mongodb');

// Parse request body helper
const parseBody = (req) => new Promise((resolve, reject) => {
  let data = '';
  req.on('data', chunk => data += chunk);
  req.on('end', () => {
    try {
      resolve(data ? JSON.parse(data) : {});
    } catch {
      resolve({});
    }
  });
  req.on('error', reject);
});

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    await connectDB();
    const db = getDB();
    
    const { action } = req.query;

    switch (action || req.url.split('?')[0].split('/').pop()) {
      case 'track':
        return await handleTrack(req, res, db);
      case 'stats':
        return await handleStats(req, res, db);
      case 'popular':
        return await handlePopular(req, res, db);
      case 'dashboard':
        return await handleDashboard(req, res, db);
      default:
        return res.status(400).json({ 
          error: 'Invalid action',
          available: ['track', 'stats', 'popular', 'dashboard']
        });
    }
  } catch (error) {
    console.error('[Analytics API] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Track a page view or download
async function handleTrack(req, res, db) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = await parseBody(req);
  const { 
    type,        // 'pageview' | 'download' | 'search' | 'click'
    page,        // Page path for pageview
    contentType, // 'ordinance' | 'resolution' | 'document' | 'news' | 'procurement' | 'vacancy'
    contentId,   // ID of the content
    contentTitle,// Title for reference
    metadata = {} // Additional metadata
  } = body;

  if (!type || !['pageview', 'download', 'search', 'click'].includes(type)) {
    return res.status(400).json({ 
      error: 'Invalid or missing type',
      validTypes: ['pageview', 'download', 'search', 'click']
    });
  }

  // Get client info from headers
  const userAgent = req.headers['user-agent'] || '';
  const referer = req.headers['referer'] || '';
  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  
  // Simple device detection
  const device = /mobile|android|iphone|ipad/i.test(userAgent) ? 'mobile' : 'desktop';
  
  // Simple browser detection
  let browser = 'other';
  if (/chrome/i.test(userAgent)) browser = 'chrome';
  else if (/firefox/i.test(userAgent)) browser = 'firefox';
  else if (/safari/i.test(userAgent)) browser = 'safari';
  else if (/edge/i.test(userAgent)) browser = 'edge';

  const analyticsEntry = {
    type,
    timestamp: new Date(),
    date: new Date().toISOString().split('T')[0],
    hour: new Date().getHours(),
    dayOfWeek: new Date().getDay(),
    // Content info
    page: page || (contentType ? `/${contentType}s` : '/'),
    contentType,
    contentId,
    contentTitle,
    metadata,
    // Visitor info (anonymized)
    device,
    browser,
    referer: referer.substring(0, 500),
    ipHash: Buffer.from(ip).toString('base64').substring(0, 20), // Hashed IP for privacy
    sessionId: metadata.sessionId || null
  };

  await db.collection('analytics').insertOne(analyticsEntry);

  // Update aggregated stats for quick queries
  const date = new Date().toISOString().split('T')[0];
  const statsKey = contentType && contentId 
    ? `content:${contentType}:${contentId}`
    : `page:${page || 'home'}`;

  await db.collection('analytics_stats').updateOne(
    { 
      key: statsKey,
      date: date,
      type: type 
    },
    { 
      $inc: { count: 1 },
      $set: { 
        lastUpdated: new Date(),
        contentTitle: contentTitle || null,
        contentType: contentType || null
      }
    },
    { upsert: true }
  );

  res.status(201).json({ 
    success: true,
    message: 'Event tracked'
  });
}

// Get stats for a specific content or time period
async function handleStats(req, res, db) {
  const { 
    contentType, 
    contentId, 
    days = '30',
    page,
    type = 'pageview'
  } = req.query;

  const daysNum = Math.min(365, Math.max(1, parseInt(days)));
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysNum);

  let matchStage = {
    timestamp: { $gte: startDate },
    type: type
  };

  if (contentType && contentId) {
    matchStage.contentType = contentType;
    matchStage.contentId = contentId;
  } else if (page) {
    matchStage.page = page;
  }

  const stats = await db.collection('analytics').aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          type: '$type'
        },
        count: { $sum: 1 },
        uniqueVisitors: { $addToSet: '$ipHash' }
      }
    },
    { $sort: { '_id.date': -1 } },
    {
      $project: {
        date: '$_id.date',
        type: '$_id.type',
        count: 1,
        uniqueCount: { $size: '$uniqueVisitors' },
        _id: 0
      }
    }
  ]).toArray();

  // Calculate totals
  const total = stats.reduce((sum, s) => sum + s.count, 0);
  const uniqueTotal = new Set(stats.flatMap(s => s.uniqueVisitors || [])).size;

  res.json({
    period: `Last ${daysNum} days`,
    type: type,
    filter: contentType && contentId 
      ? { contentType, contentId }
      : page ? { page } : 'all',
    total,
    uniqueTotal,
    daily: stats
  });
}

// Get popular content
async function handlePopular(req, res, db) {
  const { 
    contentType,
    days = '30',
    limit = '10',
    metric = 'views' // 'views' | 'downloads'
  } = req.query;

  const daysNum = Math.min(365, Math.max(1, parseInt(days)));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysNum);

  const eventType = metric === 'downloads' ? 'download' : 'pageview';

  let matchStage = {
    timestamp: { $gte: startDate },
    type: eventType,
    contentId: { $exists: true, $ne: null }
  };

  if (contentType) {
    matchStage.contentType = contentType;
  }

  const pipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: {
          contentId: '$contentId',
          contentType: '$contentType',
          contentTitle: '$contentTitle'
        },
        count: { $sum: 1 },
        uniqueVisitors: { $addToSet: '$ipHash' },
        lastViewed: { $max: '$timestamp' }
      }
    },
    { $sort: { count: -1 } },
    { $limit: limitNum },
    {
      $project: {
        contentId: '$_id.contentId',
        contentType: '$_id.contentType',
        contentTitle: '$_id.contentTitle',
        views: '$count',
        uniqueViews: { $size: '$uniqueVisitors' },
        lastViewed: 1,
        _id: 0
      }
    }
  ];

  const popular = await db.collection('analytics').aggregate(pipeline).toArray();

  res.json({
    period: `Last ${daysNum} days`,
    metric: eventType,
    contentType: contentType || 'all',
    total: popular.length,
    results: popular
  });
}

// Dashboard summary for admin
async function handleDashboard(req, res, db) {
  const { days = '30' } = req.query;
  const daysNum = parseInt(days);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysNum);

  const [overview, byType, byContentType, topPages, deviceStats] = await Promise.all([
    // Overview stats
    db.collection('analytics').aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]).toArray(),

    // By event type over time
    db.collection('analytics').aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            type: '$type'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]).toArray(),

    // By content type
    db.collection('analytics').aggregate([
      { 
        $match: { 
          timestamp: { $gte: startDate },
          contentType: { $exists: true, $ne: null }
        } 
      },
      {
        $group: {
          _id: '$contentType',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]).toArray(),

    // Top pages
    db.collection('analytics').aggregate([
      { $match: { timestamp: { $gte: startDate }, type: 'pageview' } },
      {
        $group: {
          _id: '$page',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]).toArray(),

    // Device stats
    db.collection('analytics').aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      {
        $group: {
          _id: '$device',
          count: { $sum: 1 }
        }
      }
    ]).toArray()
  ]);

  res.json({
    period: `Last ${daysNum} days`,
    summary: {
      totalEvents: overview.reduce((sum, o) => sum + o.count, 0),
      pageViews: overview.find(o => o._id === 'pageview')?.count || 0,
      downloads: overview.find(o => o._id === 'download')?.count || 0,
      searches: overview.find(o => o._id === 'search')?.count || 0
    },
    byType,
    byContentType,
    topPages,
    deviceStats
  });
}
