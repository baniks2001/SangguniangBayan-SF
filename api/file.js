/**
 * File API - Streams files directly from MongoDB GridFS
 * GET /api/file?id=:id - View/stream file from GridFS
 * GET /api/file?id=:id&download=true - Download file with original filename
 */

const { MongoClient, ObjectId } = require('mongodb');
const { GridFSBucket } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const BUCKET_NAME = 'uploads';

// Cache client connection for serverless reuse
let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  const client = new MongoClient(MONGODB_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });

  await client.connect();
  const db = client.db();
  
  cachedClient = client;
  cachedDb = db;
  
  return { client, db };
}

function getBucket(db) {
  return new GridFSBucket(db, { bucketName: BUCKET_NAME });
}

module.exports = async (req, res) => {
  // CORS headers
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

  let client;
  
  try {
    const { id, download } = req.query;
    const isDownload = download === 'true';

    console.log(`[File API] Received request - id: ${id}, download: ${isDownload}`);

    if (!id) {
      return res.status(400).json({ error: 'File ID is required (use ?id=FILE_ID)' });
    }

    // Validate ObjectId (must be 24 character hex string)
    if (!ObjectId.isValid(id) || id.length !== 24) {
      console.error(`[File API] Invalid file ID format: "${id}" (length: ${id.length})`);
      return res.status(400).json({ 
        error: 'Invalid file ID format',
        details: `ID must be a 24-character hex string. Received: "${id}"`,
        receivedId: id
      });
    }

    // Connect to MongoDB
    const { client: mongoClient, db } = await connectToDatabase();
    client = mongoClient;
    
    const bucket = getBucket(db);
    const fileId = new ObjectId(id);

    // Find file metadata
    const files = await bucket.find({ _id: fileId }).toArray();
    
    if (files.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    const file = files[0];
    const contentType = file.contentType || 'application/octet-stream';
    const contentLength = file.length;
    const originalName = file.metadata?.originalName || file.filename;

    // Set response headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', contentLength);
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    
    if (isDownload) {
      res.setHeader('Content-Disposition', `attachment; filename="${originalName}"`);
    }

    // Stream file from GridFS
    const downloadStream = bucket.openDownloadStream(fileId);
    
    downloadStream.on('error', (error) => {
      console.error('[GridFS] Stream error:', error.message);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error streaming file' });
      }
    });

    downloadStream.pipe(res);
    
  } catch (error) {
    console.error('[File API] Error:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Failed to retrieve file',
        details: error.message 
      });
    }
  }
  // Don't close client here - it's cached for reuse
};
