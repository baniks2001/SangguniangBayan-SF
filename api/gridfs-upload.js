/**
 * GridFS file upload utility for public-site
 * Saves files to MongoDB GridFS instead of temporary local storage
 */

const { MongoClient, ObjectId, GridFSBucket } = require('mongodb');

let cachedClient = null;
let cachedDb = null;

async function getDB() {
  if (cachedClient && cachedDb) {
    try {
      await cachedDb.admin().ping();
      return { client: cachedClient, db: cachedDb };
    } catch (error) {
      // Connection is stale, reset and reconnect
      cachedClient = null;
      cachedDb = null;
    }
  }

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME || 'sangguniang_bayan';

  const client = new MongoClient(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
  });

  await client.connect();
  const db = client.db(dbName);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

async function uploadToGridFS(buffer, filename, contentType = 'application/octet-stream', metadata = {}) {
  try {
    const { db } = await getDB();
    const bucket = new GridFSBucket(db, { bucketName: 'uploads' });

    // Create a unique filename with timestamp
    const uniqueFilename = `${Date.now()}-${Math.round(Math.random() * 1E9)}-${filename}`;
    
    // Upload to GridFS
    const uploadStream = bucket.openUploadStream(uniqueFilename, {
      metadata: {
        ...metadata,
        originalName: filename,
        uploadDate: new Date().toISOString(),
        contentType: contentType,
        uploadedBy: 'public-site'
      },
      contentType: contentType
    });

    // Return a promise that resolves when upload is complete
    return new Promise((resolve, reject) => {
      uploadStream.write(buffer, (error) => {
        if (error) {
          reject(error);
          return;
        }
        
        uploadStream.end(() => {
          const fileId = uploadStream.id;
          resolve({
            fileId: fileId.toString(),
            filename: uniqueFilename,
            originalName: filename,
            contentType: contentType,
            size: buffer.length,
            url: `gridfs://${fileId.toString()}`
          });
        });
      });

      uploadStream.on('error', (error) => {
        reject(error);
      });
    });
  } catch (error) {
    console.error('GridFS upload error:', error);
    throw new Error('Failed to upload file to GridFS');
  }
}

async function getGridFSFile(fileId) {
  try {
    const { db } = await getDB();
    const bucket = new GridFSBucket(db, { bucketName: 'uploads' });
    
    const files = await bucket.find({ _id: new ObjectId(fileId) }).toArray();
    if (!files || files.length === 0) {
      return null;
    }
    
    return files[0];
  } catch (error) {
    console.error('GridFS get file error:', error);
    return null;
  }
}

module.exports = {
  uploadToGridFS,
  getGridFSFile,
  getDB
};
