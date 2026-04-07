/**
 * Organization API - Public endpoint
 * Based on admin-site routes/organization.js pattern
 * 
 * GET /api/organization - List organization members
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
    const collection = db.collection('organization_members');

    const { category } = req.query;

    // Build query (admin-site pattern)
    const query = {};
    if (category) query.category = category;

    const members = await collection
      .find(query)
      .sort({ displayOrder: 1, createdAt: -1 })
      .toArray();

    // Transform _id to id (admin-site pattern)
    const transformed = members.map(m => ({
      ...m,
      id: m._id.toString(),
      _id: undefined
    }));

    res.status(200).json({ members: transformed });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch members',
      details: error.message
    });
  }
};
