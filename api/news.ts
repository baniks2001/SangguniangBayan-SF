// Serverless function to fetch published news
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectToDatabase } from './_lib/mongodb';

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
    const collection = db.collection('news');

    const { category, page = 1, limit = 10 } = req.query;

    const query: any = { isPublished: true };
    
    if (category) query.category = category;

    const skip = (Number(page) - 1) * Number(limit);

    const [news, total] = await Promise.all([
      collection
        .find(query)
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .toArray(),
      collection.countDocuments(query)
    ]);

    const transformedNews = news.map((item: any) => ({
      ...item,
      id: item._id.toString(),
      _id: undefined
    }));

    res.status(200).json({
      news: transformedNews,
      pagination: {
        current: Number(page),
        total: Math.ceil(total / Number(limit)),
        totalItems: total
      }
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
}
