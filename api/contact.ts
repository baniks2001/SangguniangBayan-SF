// Serverless function to submit contact form
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
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, subject, message, phone } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        fields: ['name', 'email', 'subject', 'message']
      });
    }

    // Connect to database first (admin-site pattern)
    await connectDB();
    const db = getDB();
    const collection = db.collection('contacts');

    // Insert contact submission (admin-site pattern)
    const result = await collection.insertOne({
      name,
      email,
      phone: phone || '',
      subject,
      message,
      status: 'unread',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    res.status(201).json({
      message: 'Contact form submitted successfully',
      id: result.insertedId.toString()
    });
  } catch (error) {
    console.error('Error submitting contact form:', error);
    res.status(500).json({ 
      error: 'Failed to submit contact form', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
