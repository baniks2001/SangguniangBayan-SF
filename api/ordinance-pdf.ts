// Serverless function to view/download ordinance PDF
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectToDatabase } from './_lib/mongodb';
import { ObjectId } from 'mongodb';
import https from 'https';
import http from 'http';

// Helper function to fetch and stream PDF
const streamPdf = (url: string, res: VercelResponse, filename: string): Promise<void> => {
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
      return res.status(400).json({ error: 'Ordinance ID is required' });
    }

    const { db } = await connectToDatabase();
    const collection = db.collection('ordinances');

    // Fetch ordinance - only approved and public
    const ordinance = await collection.findOne({
      _id: new ObjectId(id),
      isPublic: true,
      status: 'Approved'
    });

    if (!ordinance) {
      return res.status(404).json({ error: 'Ordinance not found' });
    }

    if (!ordinance.pdfUrl) {
      return res.status(404).json({ error: 'PDF not available for this ordinance' });
    }

    // Determine if it's an external URL or local path
    const pdfUrl = ordinance.pdfUrl;
    const filename = `Ordinance-${ordinance.ordinanceNumber}-${ordinance.series}.pdf`;
    
    if (pdfUrl.startsWith('http')) {
      // External URL - redirect or download
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
    console.error('Error fetching ordinance PDF:', error);
    res.status(500).json({ error: 'Failed to fetch PDF' });
  }
}
