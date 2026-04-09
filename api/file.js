/**
 * File Proxy API - Proxies GridFS file requests to admin backend
 * GET /api/file?id=:id - View/stream file from GridFS
 * GET /api/file?id=:id&download=true - Download file with original filename
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

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
    const adminUrl = new URL(`${ADMIN_API_URL}${endpoint}`);
    
    console.log(`[File Proxy] Requesting file from admin: ${adminUrl.toString()}`);

    // Choose http or https based on URL
    const client = adminUrl.protocol === 'https:' ? https : http;

    // Use Node.js native http module for better serverless compatibility
    const proxyRequest = new Promise((resolve, reject) => {
      const request = client.get(adminUrl.toString(), {
        timeout: 30000, // 30 second timeout
      }, (response) => {
        const statusCode = response.statusCode;
        
        if (statusCode === 404) {
          return resolve({ error: 'File not found', status: 404 });
        }
        
        if (statusCode >= 400) {
          return resolve({ error: `Admin backend error: ${statusCode}`, status: statusCode });
        }

        // Copy headers from admin response
        const contentType = response.headers['content-type'] || 'application/octet-stream';
        const contentLength = response.headers['content-length'];
        const contentDisposition = response.headers['content-disposition'];

        res.setHeader('Content-Type', contentType);
        if (contentLength) {
          res.setHeader('Content-Length', contentLength);
        }
        if (contentDisposition) {
          res.setHeader('Content-Disposition', contentDisposition);
        }
        
        // Add cache headers for better performance
        res.setHeader('Cache-Control', 'public, max-age=31536000');

        // Pipe the response directly
        response.pipe(res);
        
        response.on('end', () => {
          resolve({ success: true });
        });
        
        response.on('error', (err) => {
          reject(err);
        });
      });

      request.on('error', (error) => {
        console.error('[File Proxy] Request error:', error.message);
        reject(error);
      });

      request.on('timeout', () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });
    });

    const result = await proxyRequest;
    
    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }
    
  } catch (error) {
    console.error('[File Proxy] Error:', error.message);
    // Only send error if headers haven't been sent yet
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Failed to retrieve file',
        details: error.message 
      });
    }
  }
};
