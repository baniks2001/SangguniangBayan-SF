// Serverless function to fetch published news
// Based on admin-site routes/news.js pattern
import { connectDB, getDB } from './_lib/mongodb';

export default async function handler(req: any, res: any) {
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
    // Connect to database first (admin-site pattern)
    await connectDB();
    const db = getDB();
    const collection = db.collection('news');

    const { category, page = '1', limit = '10' } = req.query;

    // Build query - only published news (public filter)
    const query: Record<string, unknown> = { isPublished: true };
    
    if (category) query.category = category;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
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

    // Transform _id to id for frontend compatibility (admin-site pattern)
    const transformedNews = news.map(item => ({
      ...item,
      id: item._id.toString(),
      _id: undefined
    }));

    res.status(200).json({
      news: transformedNews,
      pagination: {
        current: pageNum,
        total: Math.ceil(total / limitNum),
        totalItems: total
      }
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ 
      error: 'Failed to fetch news', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
