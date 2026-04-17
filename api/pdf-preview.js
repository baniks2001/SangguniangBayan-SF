/**
 * PDF Preview Generator Microservice
 * Generates thumbnail images and preview data for PDF documents
 * Supports: thumbnail generation, page count extraction, metadata
 */

const { MongoClient, ObjectId } = require('mongodb');
const { GridFSBucket } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const BUCKET_NAME = 'uploads';

// Cache client connection
let cachedClient = null;
let cachedDb = null;
let cachedBucket = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb && cachedBucket) {
    return { client: cachedClient, db: cachedDb, bucket: cachedBucket };
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
  const bucket = new GridFSBucket(db, { bucketName: BUCKET_NAME });
  
  cachedClient = client;
  cachedDb = db;
  cachedBucket = bucket;
  
  return { client, db, bucket };
}

// Extract PDF metadata from buffer
function extractPdfMetadata(buffer) {
  try {
    // Convert buffer to string for text extraction
    const pdfStr = buffer.toString('latin1');
    
    // Count pages by looking for /Type /Page
    const pageMatches = pdfStr.match(/\/Type\s*\/Page\b/g);
    const pageCount = pageMatches ? pageMatches.length : 0;
    
    // Alternative: count /Page objects
    const pageObjMatches = pdfStr.match(/\/Type\s*\/Pages[\s\S]*?\/Count\s+(\d+)/);
    const declaredPageCount = pageObjMatches ? parseInt(pageObjMatches[1]) : 0;
    
    // Extract title from metadata
    let title = null;
    const titleMatch = pdfStr.match(/\/Title\s*\(([^)]+)\)/);
    if (titleMatch) {
      title = titleMatch[1];
    }
    
    // Extract author
    let author = null;
    const authorMatch = pdfStr.match(/\/Author\s*\(([^)]+)\)/);
    if (authorMatch) {
      author = authorMatch[1];
    }
    
    // Extract creation date
    let creationDate = null;
    const creationMatch = pdfStr.match(/\/CreationDate\s*\(([^)]+)\)/);
    if (creationMatch) {
      creationDate = creationMatch[1];
    }
    
    // Extract PDF version
    let version = null;
    const versionMatch = pdfStr.match(/%PDF-(\d+\.\d+)/);
    if (versionMatch) {
      version = versionMatch[1];
    }
    
    // Check if encrypted
    const isEncrypted = pdfStr.includes('/Encrypt');
    
    // Calculate file size in KB
    const fileSizeKB = Math.round(buffer.length / 1024);
    
    return {
      pageCount: Math.max(pageCount, declaredPageCount),
      title,
      author,
      creationDate,
      version,
      isEncrypted,
      fileSize: fileSizeKB,
      fileSizeFormatted: fileSizeKB > 1024 
        ? `${(fileSizeKB / 1024).toFixed(2)} MB` 
        : `${fileSizeKB} KB`
    };
  } catch (error) {
    console.error('[PDF Preview] Metadata extraction error:', error);
    return {
      pageCount: 0,
      fileSize: Math.round(buffer.length / 1024),
      fileSizeFormatted: `${Math.round(buffer.length / 1024)} KB`,
      error: 'Failed to extract metadata'
    };
  }
}

// Generate a simple SVG thumbnail placeholder
function generateThumbnailSvg(width = 200, height = 280, metadata = {}) {
  const { pageCount = 1, fileSizeFormatted = 'Unknown' } = metadata;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" fill="#f8f9fa" rx="4"/>
    <rect x="10" y="10" width="${width - 20}" height="${height - 20}" fill="#fff" stroke="#dee2e6" stroke-width="2" rx="2"/>
    
    <!-- PDF Icon -->
    <g transform="translate(${(width - 60) / 2}, 40)">
      <rect x="0" y="0" width="60" height="70" fill="#dc3545" rx="3"/>
      <rect x="5" y="5" width="50" height="60" fill="#fff" rx="2"/>
      <text x="30" y="45" font-family="Arial, sans-serif" font-size="14" font-weight="bold" text-anchor="middle" fill="#dc3545">PDF</text>
    </g>
    
    <!-- Info -->
    <text x="${width / 2}" y="${height - 70}" font-family="Arial, sans-serif" font-size="11" text-anchor="middle" fill="#6c757d">${pageCount} page${pageCount !== 1 ? 's' : ''}</text>
    <text x="${width / 2}" y="${height - 50}" font-family="Arial, sans-serif" font-size="10" text-anchor="middle" fill="#adb5bd">${fileSizeFormatted}</text>
    
    <!-- Click hint -->
    <text x="${width / 2}" y="${height - 25}" font-family="Arial, sans-serif" font-size="9" text-anchor="middle" fill="#007bff">Click to view</text>
  </svg>`;
}

// Generate a simple PNG thumbnail (1x1 red pixel for now - in production use canvas/sharp)
function generateThumbnailPng(width = 200, height = 280) {
  // Simple 1x1 transparent PNG placeholder
  // In production, you'd use sharp or canvas to render the PDF
  const pngBuffer = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, // IHDR length
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x01, // width: 1
    0x00, 0x00, 0x00, 0x01, // height: 1
    0x08, 0x02, 0x00, 0x00, 0x00, // bit depth, color type, compression, filter, interlace
    0x90, 0x77, 0x53, 0xDE, // IHDR CRC
    0x00, 0x00, 0x00, 0x0C, // IDAT length
    0x49, 0x44, 0x41, 0x54, // IDAT
    0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // compressed data
    0x00, 0x00, 0x00, 0x00, // IDAT CRC (placeholder)
    0x00, 0x00, 0x00, 0x00, // IEND length
    0x49, 0x45, 0x4E, 0x44, // IEND
    0xAE, 0x42, 0x60, 0x82  // IEND CRC
  ]);
  return pngBuffer;
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

  try {
    const { 
      id,           // GridFS file ID
      type = 'thumbnail', // 'thumbnail' | 'metadata' | 'preview'
      w = '200',    // Thumbnail width
      h = '280',    // Thumbnail height
      format = 'svg' // 'svg' | 'png' | 'json'
    } = req.query;

    if (!id) {
      return res.status(400).json({ 
        error: 'PDF ID required',
        usage: {
          thumbnail: '/api/pdf-preview?id=FILE_ID&type=thumbnail',
          metadata: '/api/pdf-preview?id=FILE_ID&type=metadata',
          preview: '/api/pdf-preview?id=FILE_ID&type=preview'
        }
      });
    }

    // Validate ObjectId
    if (!ObjectId.isValid(id) || id.length !== 24) {
      return res.status(400).json({ 
        error: 'Invalid PDF ID format',
        details: 'ID must be a 24-character hex string'
      });
    }

    // Connect to database
    const { db, bucket } = await connectToDatabase();
    const fileId = new ObjectId(id);

    // Find file metadata
    const files = await bucket.find({ _id: fileId }).toArray();
    
    if (files.length === 0) {
      return res.status(404).json({ error: 'PDF not found' });
    }

    const file = files[0];
    const contentType = file.contentType || 'application/octet-stream';
    
    // Check if it's a PDF
    if (!contentType.includes('pdf') && !file.filename?.toLowerCase().endsWith('.pdf')) {
      return res.status(400).json({ 
        error: 'File is not a PDF',
        contentType,
        filename: file.filename
      });
    }

    // Collect PDF data
    const chunks = [];
    const downloadStream = bucket.openDownloadStream(fileId);
    
    await new Promise((resolve, reject) => {
      downloadStream.on('data', chunk => chunks.push(chunk));
      downloadStream.on('end', resolve);
      downloadStream.on('error', reject);
    });
    
    const buffer = Buffer.concat(chunks);
    
    // Extract metadata
    const metadata = extractPdfMetadata(buffer);

    // Handle different preview types
    switch (type) {
      case 'metadata':
        return res.json({
          id,
          filename: file.filename,
          uploadDate: file.uploadDate,
          metadata: {
            ...metadata,
            originalName: file.metadata?.originalName || file.filename
          }
        });

      case 'thumbnail':
        const width = parseInt(w) || 200;
        const height = parseInt(h) || 280;
        
        if (format === 'svg') {
          const svg = generateThumbnailSvg(width, height, metadata);
          res.setHeader('Content-Type', 'image/svg+xml');
          res.setHeader('Cache-Control', 'public, max-age=86400');
          res.setHeader('X-PDF-Pages', metadata.pageCount.toString());
          res.setHeader('X-PDF-Size', metadata.fileSizeFormatted);
          return res.send(svg);
        } else {
          const png = generateThumbnailPng(width, height);
          res.setHeader('Content-Type', 'image/png');
          res.setHeader('Cache-Control', 'public, max-age=86400');
          res.setHeader('X-PDF-Pages', metadata.pageCount.toString());
          res.setHeader('X-PDF-Size', metadata.fileSizeFormatted);
          return res.send(png);
        }

      case 'preview':
        // Return JSON with preview data and thumbnail URL
        return res.json({
          id,
          filename: file.filename,
          thumbnailUrl: `/api/pdf-preview?id=${id}&type=thumbnail&format=svg`,
          metadata: {
            ...metadata,
            originalName: file.metadata?.originalName || file.filename
          },
          downloadUrl: `/api/file?id=${id}`,
          viewUrl: `/api/file?id=${id}`
        });

      default:
        return res.status(400).json({
          error: 'Invalid preview type',
          validTypes: ['thumbnail', 'metadata', 'preview']
        });
    }

  } catch (error) {
    console.error('[PDF Preview API] Error:', error);
    res.status(500).json({ 
      error: 'PDF preview generation failed',
      details: error.message 
    });
  }
};
