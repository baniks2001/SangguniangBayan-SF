/**
 * Ordinances API - Public endpoint
 * Fetches ordinances from MongoDB directly
 * 
 * GET /api/ordinances - List public/approved ordinances
 */

const { connectDB, getDB } = require('./database');
const { ObjectId } = require('mongodb');

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

    const { series, search, page = '1', limit = '10', status, showAll } = req.query;

    // Build query - by default show only public approved ordinances
    const query = {};
    const andConditions = [];
    
    // If showAll is true, don't filter by status and isPublic
    if (!showAll) {
      // Build a more flexible query
      const statusQuery = status ? 
        { status: status } : 
        { $or: [{ status: 'Approved' }, { status: { $exists: false } }] };
      
      const publicQuery = { $or: [{ isPublic: true }, { isPublic: { $exists: false } }] };
      
      andConditions.push(statusQuery, publicQuery);
    }
    
    if (series) {
      andConditions.push({ series: series });
    }
    
    if (search) {
      andConditions.push({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } },
          { ordinanceNumber: { $regex: search, $options: 'i' } }
        ]
      });
    }
    
    if (andConditions.length > 0) {
      query.$and = andConditions;
    }

    console.log('Ordinances Query:', JSON.stringify(query));

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // First check total count without filters
    const totalCount = await collection.countDocuments();
    const approvedCount = await collection.countDocuments({ status: 'Approved' });
    const publicCount = await collection.countDocuments({ isPublic: true });
    const bothCount = await collection.countDocuments({ status: 'Approved', isPublic: true });
    
    console.log(`DB Stats - Total: ${totalCount}, Approved: ${approvedCount}, Public: ${publicCount}, Both: ${bothCount}`);

    const [ordinances, total] = await Promise.all([
      collection
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .toArray(),
      collection.countDocuments(query)
    ]);

    console.log(`Found ${ordinances.length} ordinances matching query`);

    // If no results with strict filter, try showing all (fallback for debugging)
    if (ordinances.length === 0 && !showAll) {
      console.log('No approved public ordinances found, checking all documents...');
      const allDocs = await collection
        .find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray();
      console.log(`Sample docs in DB: ${allDocs.length}`);
      if (allDocs.length > 0) {
        console.log('Sample doc:', { 
          id: allDocs[0]._id, 
          status: allDocs[0].status, 
          isPublic: allDocs[0].isPublic,
          title: allDocs[0].title?.substring(0, 50)
        });
      }
    }

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
        total: Math.ceil(total / limitNum),
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
