/**
 * Health API - Public endpoint
 * Based on admin-site server.js health check pattern
 * 
 * GET /api/health - Check API and database status
 */

const { connectDB, getDB } = require('./database');

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check environment variable
    const hasMongoUri = !!process.env.MONGODB_URI;
    
    if (!hasMongoUri) {
      return res.status(500).json({
        status: 'ERROR',
        timestamp: new Date().toISOString(),
        error: 'MONGODB_URI environment variable is not set',
        hint: 'Please set MONGODB_URI in your Vercel project settings'
      });
    }

    // Test database connection (admin-site pattern)
    await connectDB();
    const db = getDB();
    await db.admin().ping();

    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: 'MongoDB Atlas - Connected',
      hasEnvVars: true
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({ 
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed',
      details: error.message,
      hasEnvVars: !!process.env.MONGODB_URI
    });
  }
};
