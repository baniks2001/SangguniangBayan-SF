// Serverless function for resolutions (list + PDF)
// Consolidated for Vercel Hobby plan (12 function limit)
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
    const { id, download, series, search, page = '1', limit = '10' } = req.query;

    // Connect to database (admin-site pattern)
    await connectDB();
    const db = getDB();
    const collection = db.collection('resolutions');

    // If ID provided, serve PDF
    if (id) {
      const resolution = await collection.findOne({
        _id: new ObjectId(id as string),
        isPublic: true,
        status: 'Approved'
      });

      if (!resolution) {
        return res.status(404).json({ error: 'Resolution not found' });
      }

      if (!resolution.pdfUrl) {
        return res.status(404).json({ error: 'PDF not available for this resolution' });
      }

      const filename = download 
        ? `Resolution-${resolution.resolutionNumber}-${resolution.series}.pdf`
        : '';

      await streamPdf(resolution.pdfUrl, res, filename);
      return;
    }

    // Otherwise, list resolutions
    const query: Record<string, unknown> = { isPublic: true, status: 'Approved' };
    
    if (series) query.series = series;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { resolutionNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [resolutions, total] = await Promise.all([
      collection
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .toArray(),
      collection.countDocuments(query)
    ]);

    const transformedResolutions = resolutions.map(res => ({
      ...res,
      id: res._id.toString(),
      _id: undefined
    }));

    res.status(200).json({
      resolutions: transformedResolutions,
      pagination: {
        current: pageNum,
        total: Math.ceil(total / limitNum),
        totalItems: total
      }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Failed to process request', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
