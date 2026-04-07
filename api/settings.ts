// Serverless function to fetch public settings
// Inline MongoDB connection - no shared imports for Vercel compatibility
import { MongoClient, Db } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'sangguniang_bayan';

let client: MongoClient | null = null;
let db: Db | null = null;

async function connectDB(): Promise<{ client: MongoClient; db: Db }> {
  if (client && db) return { client, db };
  if (!MONGODB_URI) throw new Error('MONGODB_URI not defined');
  client = new MongoClient(MONGODB_URI);
  await client.connect();
  db = client.db(MONGODB_DB_NAME);
  return { client, db };
}

function getDB(): Db {
  if (!db) throw new Error('Database not connected');
  return db;
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
    // Connect to database first (admin-site pattern)
    await connectDB();
    const db = getDB();
    const collection = db.collection('settings');

    // Get all public settings
    const settings = await collection.find({}).toArray();
    
    // Convert to key-value object (admin-site pattern)
    const settingsMap: Record<string, any> = {};
    settings.forEach((setting: any) => {
      settingsMap[setting.key] = setting.value;
    });

    // Default settings if not found
    const defaultSettings = {
      municipalityName: 'San Francisco',
      provinceName: 'Southern Leyte',
      sbTitle: 'Sangguniang Bayan',
      officeLocation: 'Municipal Hall, San Francisco, Southern Leyte',
      contactEmail: 'sb.sanfrancisco@gmail.com',
      contactPhone: '(053) 514-1234',
      officeHours: 'Monday - Friday, 8:00 AM - 5:00 PM',
      ...settingsMap
    };

    res.status(200).json({ settings: defaultSettings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ 
      error: 'Failed to fetch settings', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
