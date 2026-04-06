// Serverless function to submit job application
import { MongoClient, Db, ObjectId } from 'mongodb';

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
    const { 
      vacancyId,
      fullName,
      age,
      mobileNumber,
      email,
      address,
      education,
      experience,
      certifications,
      coverLetter,
      resumeUrl,
      certificateUrls
    } = req.body;

    // Validate required fields
    if (!vacancyId || !fullName || !age || !mobileNumber || !email || !address) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['vacancyId', 'fullName', 'age', 'mobileNumber', 'email', 'address']
      });
    }

    const { db } = await connectToDatabase();
    const collection = db.collection('applications');
    const vacanciesCollection = db.collection('vacancies');

    // Verify vacancy exists and is active
    const vacancy = await vacanciesCollection.findOne({ 
      _id: new ObjectId(vacancyId),
      status: 'Active'
    });

    if (!vacancy) {
      return res.status(404).json({ error: 'Vacancy not found or no longer active' });
    }

    // Insert application
    const result = await collection.insertOne({
      vacancyId,
      vacancyTitle: vacancy.jobTitle || vacancy.position,
      fullName,
      age: Number(age),
      mobileNumber,
      email,
      address,
      education: education || '',
      experience: experience || '',
      certifications: certifications || '',
      coverLetter: coverLetter || '',
      resumeUrl: resumeUrl || '',
      certificateUrls: certificateUrls || [],
      status: 'Pending',
      submittedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    res.status(201).json({
      message: 'Application submitted successfully',
      id: result.insertedId.toString()
    });
  } catch (error) {
    console.error('Error submitting application:', error);
    res.status(500).json({ 
      error: 'Failed to submit application', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
