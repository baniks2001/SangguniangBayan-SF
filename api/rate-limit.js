/**
 * Rate Limiting Gateway - Protects submit endpoints from spam and abuse
 * Uses MongoDB for distributed rate limiting across serverless instances
 */

const { connectDB, getDB } = require('./database');

// Rate limit configuration
const RATE_LIMITS = {
  // Contact form: 3 submissions per 15 minutes per IP
  contact: { windowMs: 15 * 60 * 1000, maxRequests: 3 },
  
  // Job applications: 5 applications per hour per IP
  apply: { windowMs: 60 * 60 * 1000, maxRequests: 5 },
  
  // Search: 100 searches per 15 minutes per IP
  search: { windowMs: 15 * 60 * 1000, maxRequests: 100 },
  
  // Analytics tracking: 500 events per 15 minutes per IP
  analytics: { windowMs: 15 * 60 * 1000, maxRequests: 500 },
  
  // Default: 50 requests per 15 minutes
  default: { windowMs: 15 * 60 * 1000, maxRequests: 50 }
};

// Get client IP from various headers
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

// Check if request is within rate limit
async function checkRateLimit(db, identifier, action) {
  const config = RATE_LIMITS[action] || RATE_LIMITS.default;
  const now = new Date();
  const windowStart = new Date(now.getTime() - config.windowMs);
  
  const collection = db.collection('rate_limits');
  
  // Clean old entries and increment current window
  const result = await collection.findOneAndUpdate(
    { 
      identifier,
      action,
      windowStart: { $gte: windowStart }
    },
    {
      $setOnInsert: { 
        windowStart: now,
        action,
        identifier
      },
      $inc: { count: 1 },
      $set: { lastRequest: now }
    },
    { 
      upsert: true,
      returnDocument: 'after'
    }
  );
  
  const count = result?.count || 1;
  const remaining = Math.max(0, config.maxRequests - count);
  const resetTime = result?.windowStart 
    ? new Date(result.windowStart.getTime() + config.windowMs)
    : new Date(now.getTime() + config.windowMs);
  
  return {
    allowed: count <= config.maxRequests,
    count,
    remaining,
    limit: config.maxRequests,
    resetTime,
    windowMs: config.windowMs
  };
}

// Clean up old rate limit entries (run periodically)
async function cleanupOldEntries(db) {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
  await db.collection('rate_limits').deleteMany({
    lastRequest: { $lt: cutoff }
  });
}

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Rate-Limit-Check');
  
  // Rate limit headers
  res.setHeader('X-Rate-Limit-Policy', 'sliding-window');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    await connectDB();
    const db = getDB();
    
    // Periodic cleanup (1% chance to run on each request)
    if (Math.random() < 0.01) {
      cleanupOldEntries(db).catch(console.error);
    }

    const { action, check, ip: providedIp } = req.query;
    const clientIp = providedIp || getClientIp(req);
    
    // If just checking status (no action specified)
    if (check === 'true' || !action) {
      const checks = {};
      const actionsToCheck = action ? [action] : Object.keys(RATE_LIMITS);
      
      for (const act of actionsToCheck) {
        const identifier = `${clientIp}:${act}`;
        checks[act] = await checkRateLimit(db, identifier, act);
      }
      
      return res.json({
        ip: clientIp,
        checks,
        timestamp: new Date().toISOString()
      });
    }

    // Validate action
    if (!RATE_LIMITS[action]) {
      return res.status(400).json({
        error: 'Invalid action',
        available: Object.keys(RATE_LIMITS)
      });
    }

    const identifier = `${clientIp}:${action}`;
    const limitInfo = await checkRateLimit(db, identifier, action);
    
    // Set rate limit headers
    res.setHeader('X-Rate-Limit-Limit', limitInfo.limit.toString());
    res.setHeader('X-Rate-Limit-Remaining', limitInfo.remaining.toString());
    res.setHeader('X-Rate-Limit-Reset', limitInfo.resetTime.toISOString());
    res.setHeader('X-Rate-Limit-Count', limitInfo.count.toString());

    if (!limitInfo.allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Too many ${action} requests. Please try again later.`,
        retryAfter: Math.ceil((limitInfo.resetTime - new Date()) / 1000),
        limit: limitInfo.limit,
        window: `${RATE_LIMITS[action].windowMs / 60000} minutes`,
        resetTime: limitInfo.resetTime
      });
    }

    res.json({
      allowed: true,
      action,
      limit: limitInfo.limit,
      remaining: limitInfo.remaining,
      resetTime: limitInfo.resetTime,
      message: 'Request allowed'
    });

  } catch (error) {
    console.error('[Rate Limit API] Error:', error);
    // Fail open - allow request if rate limiter fails
    res.status(500).json({ 
      error: 'Rate limit check failed',
      allowed: true, // Fail open for reliability
      warning: 'Rate limit check could not be completed'
    });
  }
};
