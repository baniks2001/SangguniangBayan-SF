/**
 * Ordinances API - Public endpoint
 * Matches admin-site routes/ordinances.js pattern exactly
 * 
 * GET /api/ordinances - List ordinances with filtering
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
    // Connect to database like admin-site does
    await connectDB();
    const db = getDB();

    // Parse query params exactly like admin-site
    const { status, isPublic, series, search, page = '1', limit = '10' } = req.query;

    // Build query exactly like admin-site
    let query = {};
    if (status) query.status = status;
    if (isPublic !== undefined) query.isPublic = isPublic === 'true';
    if (series) query.series = series;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { ordinanceNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination exactly like admin-site
    const skip = (Number(page) - 1) * Number(limit);

    // Fetch data exactly like admin-site
    const [ordinances, total] = await Promise.all([
      db.collection('ordinances')
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .toArray(),
      db.collection('ordinances').countDocuments(query)
    ]);

    // Transform exactly like admin-site
    const transformedOrdinances = ordinances.map(ord => ({
      ...ord,
      id: ord._id.toString(),
      _id: undefined
    }));

    // Return exactly like admin-site
    res.json({
      ordinances: transformedOrdinances,
      pagination: {
        total: Math.ceil(total / Number(limit)),
        page: Number(page),
        limit: Number(limit),
        totalItems: total
      }
    });
  } catch (error) {
    console.error('Error fetching ordinances:', error);
    res.status(500).json({ error: 'Failed to fetch ordinances' });
  }
};
