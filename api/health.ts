// Health check endpoint to verify API and database connectivity
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectToDatabase } from './_lib/mongodb';

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
