// Serverless function to fetch organization members
// Based on admin-site routes/organization.js pattern
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
    const collection = db.collection('organization_members');

    const { category } = req.query;

    // Build query
    const query: Record<string, unknown> = {};
    if (category) query.category = category;

    const members = await collection
      .find(query)
      .sort({ displayOrder: 1, createdAt: -1 })
      .toArray();

    // Transform _id to id for frontend compatibility (admin-site pattern)
    const transformed = members.map(m => ({
      ...m,
      id: m._id.toString(),
      _id: undefined
    }));

    res.status(200).json({ members: transformed });
  } catch (error) {
    console.error('Error fetching organization members:', error);
    res.status(500).json({ 
      error: 'Failed to fetch members', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
