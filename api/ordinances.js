/**
 * Ordinances API - Public endpoint
 * Fetches ordinances from MongoDB directly
 * 
 * GET /api/ordinances - List public/approved ordinances
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
    await connectDB();
    const db = getDB();
    const collection = db.collection('ordinances');

    const { series, search, page = '1', limit = '10' } = req.query;

    // Simple query like working APIs - match working pattern
    let query = { status: 'Approved', isPublic: true };

    // Add series filter
    if (series) {
      query.series = series;
    }
    
    // Add search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { ordinanceNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [ordinances, total] = await Promise.all([
      collection
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .toArray(),
      collection.countDocuments(query)
    ]);

    // Transform _id to id
    const transformed = ordinances.map(ord => ({
      ...ord,
      id: ord._id.toString(),
      _id: undefined
    }));

    res.status(200).json({
      ordinances: transformed,
      pagination: {
        current: pageNum,
        total: Math.ceil(total / limitNum) || 1,
        totalItems: total
      }
    });
  } catch (error) {
    console.error('Error fetching ordinances:', error);
    res.status(500).json({ 
      error: 'Failed to fetch ordinances',
      details: error.message
    });
  }
};
