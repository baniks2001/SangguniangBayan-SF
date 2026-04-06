// Serverless function to fetch published resolutions
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectToDatabase } from './_lib/mongodb';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
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
    const { db } = await connectToDatabase();
    const collection = db.collection('resolutions');

    const { status, isPublic, series, search, page = 1, limit = 10 } = req.query;

    // Build query
    const query: any = { isPublic: true };
    
    if (status) query.status = status;
    if (series) query.series = series;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { resolutionNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [resolutions, total] = await Promise.all([
      collection
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .toArray(),
      collection.countDocuments(query)
    ]);

    // Transform _id to id for frontend compatibility
    const transformedResolutions = resolutions.map(res => ({
      ...res,
      id: res._id.toString(),
      _id: undefined
    }));

    res.status(200).json({
      resolutions: transformedResolutions,
      pagination: {
        current: Number(page),
        total: Math.ceil(total / Number(limit)),
        totalItems: total
      }
    });
  } catch (error) {
    console.error('Error fetching resolutions:', error);
    res.status(500).json({ error: 'Failed to fetch resolutions' });
  }
}
