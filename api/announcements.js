/**
 * Announcements API - Public endpoint
 * Based on admin-site routes/announcements.js pattern
 * 
 * GET /api/announcements - List active announcements
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
    const collection = db.collection('announcements');

    // Query only active announcements (public filter)
    const query = { 
      isActive: true,
      $or: [
        { expiryDate: { $exists: false } },
        { expiryDate: { $gte: new Date() } }
      ]
    };

    const announcements = await collection
      .find(query)
      .sort({ priority: -1, createdAt: -1 })
      .toArray();

    // Transform _id to id (admin-site pattern)
    const transformed = announcements.map(ann => ({
      ...ann,
      id: ann._id.toString(),
      _id: undefined
    }));

    res.status(200).json({
      announcements: transformed,
      count: transformed.length
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch announcements',
      details: error.message
    });
  }
};
