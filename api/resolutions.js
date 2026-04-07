/**
 * Resolutions API - Public endpoint
 * Based on admin-site routes/resolutions.js pattern
 * 
 * GET /api/resolutions - List published resolutions
 * GET /api/resolutions?id=xxx&download=true - Download PDF
 */

const { connectDB, getDB } = require('./database');
const { ObjectId } = require('mongodb');
const https = require('https');
const http = require('http');

// Helper to stream PDF
const streamPdf = (url, res, filename) => {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`PDF not found: ${response.statusCode}`));
        return;
      }
      res.setHeader('Content-Type', 'application/pdf');
      if (filename) {
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      }
      response.pipe(res);
      response.on('end', () => resolve());
      response.on('error', reject);
    }).on('error', reject);
  });
};

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
    const collection = db.collection('resolutions');

    const { id, download, series, search, page = '1', limit = '10' } = req.query;

    // If ID provided, serve PDF (consolidated endpoint)
    if (id) {
      const resolution = await collection.findOne({
        _id: new ObjectId(id),
        isPublic: true,
        status: 'Approved'
      });

      if (!resolution) {
        return res.status(404).json({ error: 'Resolution not found' });
      }

      if (!resolution.pdfUrl) {
        return res.status(404).json({ error: 'PDF not available' });
      }

      const filename = download 
        ? `Resolution-${resolution.resolutionNumber}-${resolution.series}.pdf`
        : '';

      await streamPdf(resolution.pdfUrl, res, filename);
      return;
    }

    // List resolutions (admin-site pattern)
    const query = { isPublic: true, status: 'Approved' };
    
    if (series) query.series = series;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { resolutionNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [resolutions, total] = await Promise.all([
      collection
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .toArray(),
      collection.countDocuments(query)
    ]);

    // Transform _id to id (admin-site pattern)
    const transformed = resolutions.map(res => ({
      ...res,
      id: res._id.toString(),
      _id: undefined
    }));

    res.status(200).json({
      resolutions: transformed,
      pagination: {
        current: pageNum,
        total: Math.ceil(total / limitNum),
        totalItems: total
      }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Failed to process request',
      details: error.message
    });
  }
};
