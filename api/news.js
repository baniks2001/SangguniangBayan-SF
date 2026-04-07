/**
 * News API - Public endpoint
 * Based on admin-site routes/news.js pattern
 * 
 * GET /api/news - List published news
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
    const collection = db.collection('news');

    const { category, page = '1', limit = '10' } = req.query;

    // Build query (admin-site pattern)
    const query = { isPublished: true };
    if (category) query.category = category;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [news, total] = await Promise.all([
      collection
        .find(query)
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .toArray(),
      collection.countDocuments(query)
    ]);

    // Transform _id to id (admin-site pattern)
    const transformed = news.map(item => ({
      ...item,
      id: item._id.toString(),
      _id: undefined
    }));

    res.status(200).json({
      news: transformed,
      pagination: {
        current: pageNum,
        total: Math.ceil(total / limitNum),
        totalItems: total
      }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch news',
      details: error.message
    });
  }
};
