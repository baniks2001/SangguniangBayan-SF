/**
 * Calendar API - Public endpoint
 * Based on admin-site routes/calendar.js pattern
 * 
 * GET /api/calendar - List calendar events
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
    // Admin-site pattern: connect first, then getDB
    await connectDB();
    const db = getDB();
    const collection = db.collection('calendar_events');

    const { year, month, upcoming, limit = '50' } = req.query;

    // Build query (admin-site pattern)
    const query = {};
    
    if (year && month) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      query.eventDate = { $gte: startDate, $lte: endDate };
    } else if (upcoming === 'true') {
      query.eventDate = { $gte: new Date() };
    }

    const limitNum = parseInt(limit, 10);

    const events = await collection
      .find(query)
      .sort({ eventDate: 1 })
      .limit(limitNum)
      .toArray();

    // Transform _id to id (admin-site pattern)
    const transformed = events.map(e => ({
      ...e,
      id: e._id.toString(),
      _id: undefined
    }));

    res.status(200).json({ events: transformed });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch events',
      details: error.message
    });
  }
};
