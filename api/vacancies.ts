// Serverless function to fetch active vacancies
// Based on admin-site routes/vacancies.js pattern
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
    const collection = db.collection('vacancies');

    // Only return active vacancies to public (public filter)
    const query = { status: 'Active' };

    const vacancies = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    // Transform _id to id for frontend compatibility (admin-site pattern)
    const transformedVacancies = vacancies.map(vac => ({
      ...vac,
      id: vac._id.toString(),
      _id: undefined
    }));

    res.status(200).json({
      vacancies: transformedVacancies,
      count: transformedVacancies.length
    });
  } catch (error) {
    console.error('Error fetching vacancies:', error);
    res.status(500).json({ 
      error: 'Failed to fetch vacancies', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
