// Serverless function to fetch active announcements
import { MongoClient, Db } from 'mongodb';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'sangguniang_bayan';

async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI not defined');
  }
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(MONGODB_DB_NAME);
  return { client, db };
}

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
    const { db } = await connectToDatabase();
    const collection = db.collection('announcements');

    // Only return active announcements to public
    const query = { 
      isActive: true,
      $or: [
        { expiryDate: { $exists: false } },
        { expiryDate: { $gte: new Date() } }
      ]
    };

    const announcements = await collection
      .find(query)
      .sort({ priority: -1, createdAt: -1 })
      .toArray();

    const transformedAnnouncements = announcements.map((ann: any) => ({
      ...ann,
      id: ann._id.toString(),
      _id: undefined
    }));

    res.status(200).json({
      announcements: transformedAnnouncements,
      count: transformedAnnouncements.length
    });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ 
      error: 'Failed to fetch announcements', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
