// Serverless function to view/download resolution PDF
import { connectToDatabase } from './_lib/mongodb';
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
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      response.pipe(res);
      response.on('end', () => resolve());
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

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Resolution ID is required' });
    }

    const { db } = await connectToDatabase();
    const collection = db.collection('resolutions');

    // Fetch resolution - only approved and public
    const resolution = await collection.findOne({
      _id: new ObjectId(id),
      isPublic: true,
      status: 'Approved'
    });

    if (!resolution) {
      return res.status(404).json({ error: 'Resolution not found' });
    }

    if (!resolution.pdfUrl) {
      return res.status(404).json({ error: 'PDF not available for this resolution' });
    }

    // Determine if it's an external URL or local path
    const pdfUrl = resolution.pdfUrl;
    const filename = `Resolution-${resolution.resolutionNumber}-${resolution.series}.pdf`;
    
    if (pdfUrl.startsWith('http')) {
      // External URL
      if (download === 'true') {
        await streamPdf(pdfUrl, res, filename);
        return;
      } else {
        return res.redirect(pdfUrl);
      }
    } else {
      // Local path - construct full URL from admin site
      const adminBaseUrl = process.env.ADMIN_SITE_URL || '';
      const fullUrl = pdfUrl.startsWith('/') ? `${adminBaseUrl}${pdfUrl}` : `${adminBaseUrl}/${pdfUrl}`;
      
      if (download === 'true') {
        await streamPdf(fullUrl, res, filename);
        return;
      } else {
        return res.redirect(fullUrl);
      }
    }
  } catch (error) {
    console.error('Error fetching resolution PDF:', error);
    res.status(500).json({ 
      error: 'Failed to fetch PDF', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
