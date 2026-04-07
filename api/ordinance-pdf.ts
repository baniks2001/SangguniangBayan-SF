// Serverless function to view/download ordinance PDF
// Based on admin-site pattern
import { connectDB, getDB } from './_lib/mongodb';
import { ObjectId } from 'mongodb';
import https from 'https';
import http from 'http';

// Helper function to fetch and stream PDF
const streamPdf = (url: string, res: any, filename: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`PDF not found: ${response.statusCode}`));
        return;
      }
      
      res.setHeader('Content-Type', 'application/pdf');
      if (filename) {
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      }
      
      response.pipe(res);
      response.on('end', () => resolve());
      response.on('error', (err) => reject(err));
    }).on('error', (err) => reject(err));
  });
};

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
    const { id, download } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Ordinance ID is required' });
    }

    // Connect to database first (admin-site pattern)
    await connectDB();
    const db = getDB();
    const collection = db.collection('ordinances');

    // Find ordinance by ID (admin-site pattern)
    const ordinance = await collection.findOne({
      _id: new ObjectId(id as string),
      isPublic: true,
      status: 'Approved'
    });

    if (!ordinance) {
      return res.status(404).json({ error: 'Ordinance not found' });
    }

    if (!ordinance.pdfUrl) {
      return res.status(404).json({ error: 'PDF not available for this ordinance' });
    }

    // Construct filename for download
    const filename = download 
      ? `Ordinance-${ordinance.ordinanceNumber}-${ordinance.series}.pdf`
      : '';

    // Stream the PDF
    await streamPdf(ordinance.pdfUrl, res, filename);
  } catch (error) {
    console.error('Error fetching ordinance PDF:', error);
    res.status(500).json({ 
      error: 'Failed to fetch PDF', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
