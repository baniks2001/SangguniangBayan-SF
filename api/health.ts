// Health check endpoint to verify API and database connectivity
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
  const client = new MongoClient(MONGODB_URI as string);
  await client.connect();
  const db = client.db(MONGODB_DB_NAME);
  cachedClient = client;
  cachedDb = db;
  return { client, db };
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const checks: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env: {
      hasMongodbUri: !!process.env.MONGODB_URI,
      dbName: process.env.MONGODB_DB_NAME || 'sangguniang_bayan'
    }
  };

  try {
    const { db } = await connectToDatabase();
    const collections = await db.listCollections().toArray();
    checks.database = {
      connected: true,
      collections: collections.map(c => c.name)
    };
    
    res.status(200).json({ 
      status: 'ok',
      ...checks
    });
  } catch (error) {
    checks.database = {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    
    res.status(500).json({ 
      status: 'error',
      ...checks
    });
  }
}
