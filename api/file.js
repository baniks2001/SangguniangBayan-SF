/**
 * File Proxy API - Proxies GridFS file requests to admin backend
 * GET /api/file?id=:id - View/stream file from GridFS
 * GET /api/file?id=:id&download=true - Download file with original filename
 */

const ADMIN_API_URL = process.env.ADMIN_API_URL || 'http://localhost:5000/api';

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
    const { id, download } = req.query;
    const isDownload = download === 'true';

    if (!id) {
      return res.status(400).json({ error: 'File ID is required (use ?id=FILE_ID)' });
    }

    // Build admin backend URL
    const endpoint = isDownload ? `/uploads/download/${id}` : `/uploads/file/${id}`;
    const adminUrl = `${ADMIN_API_URL}${endpoint}`;

    // Fetch file from admin backend
    const response = await fetch(adminUrl, {
      method: 'GET',
    });

    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({ error: 'File not found' });
      }
      throw new Error(`Admin backend error: ${response.status}`);
    }

    // Get content type and other headers from response
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const contentLength = response.headers.get('content-length');
    const contentDisposition = response.headers.get('content-disposition');

    // Set response headers
    res.setHeader('Content-Type', contentType);
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }
    if (contentDisposition) {
      res.setHeader('Content-Disposition', contentDisposition);
    }

    // Stream the response
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    res.send(buffer);
  } catch (error) {
    console.error('File proxy error:', error);
    res.status(500).json({ error: 'Failed to retrieve file' });
  }
};
