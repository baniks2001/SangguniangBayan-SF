// Serverless function to fetch calendar events
// Based on admin-site routes/calendar.js pattern
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
    const collection = db.collection('calendar_events');

    const { year, month, upcoming, limit = '50' } = req.query;

    // Build query
    const query: Record<string, unknown> = {};
    
    if (year && month) {
      const startDate = new Date(parseInt(year as string), parseInt(month as string) - 1, 1);
      const endDate = new Date(parseInt(year as string), parseInt(month as string), 0, 23, 59, 59);
      query.eventDate = { $gte: startDate, $lte: endDate };
    } else if (upcoming === 'true') {
      query.eventDate = { $gte: new Date() };
    }

    const limitNum = parseInt(limit as string, 10);

    const events = await collection
      .find(query)
      .sort({ eventDate: 1 })
      .limit(limitNum)
      .toArray();

    // Transform _id to id for frontend compatibility (admin-site pattern)
    const transformed = events.map(e => ({
      ...e,
      id: e._id.toString(),
      _id: undefined
    }));

    res.status(200).json({ events: transformed });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ 
      error: 'Failed to fetch events', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
