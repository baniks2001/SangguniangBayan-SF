/**
 * Database connection for serverless functions
 * Optimized for high API throughput with connection pooling
 */

const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'sangguniang_bayan';

let cachedClient = null;
let cachedDb = null;
let connectionMetrics = { totalRequests: 0, cacheHits: 0, cacheMisses: 0 };

// Performance-optimized MongoDB client options for serverless
const getMongoOptions = () => ({
  // Connection Pool Settings - optimized for serverless/API workload
  maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE) || 50,
  minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE) || 5,
  maxIdleTimeMS: 30000,       // Close idle connections faster for serverless
  waitQueueTimeoutMS: 3000,   // Wait up to 3s for available connection
  
  // Timeouts
  serverSelectionTimeoutMS: 8000,
  connectTimeoutMS: 8000,
  socketTimeoutMS: 30000,
  
  // Performance
  compressors: ['zstd', 'zlib', 'snappy'],
  readPreference: 'primaryPreferred',
  retryWrites: true,
  retryReads: true,
  
  // Monitoring
  heartbeatFrequencyMS: 15000,
  minHeartbeatFrequencyMS: 500,
});

async function connectDB() {
  connectionMetrics.totalRequests++;
  
  // Return cached connection if available and healthy
  if (cachedClient && cachedDb) {
    try {
      // Quick health check - admin command is lightweight
      await cachedDb.admin().ping();
      connectionMetrics.cacheHits++;
      return { client: cachedClient, db: cachedDb };
    } catch (error) {
      // Connection is stale, reset and reconnect
      console.warn('Cached MongoDB connection stale, reconnecting...');
      cachedClient = null;
      cachedDb = null;
    }
  }
  
  connectionMetrics.cacheMisses++;

  if (!uri) {
    throw new Error('MONGODB_URI environment variable not set');
  }

  const options = getMongoOptions();
  const client = new MongoClient(uri, options);
  
  // Monitor connection events
  client.on('connectionCheckOutFailed', (event) => {
    console.warn(`MongoDB connection checkout failed: ${event.reason}`);
  });

  await client.connect();
  const db = client.db(dbName);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

function getDB() {
  if (!cachedDb) {
    throw new Error('Database not connected. Call connectDB first.');
  }
  return cachedDb;
}

function getConnectionMetrics() {
  return {
    ...connectionMetrics,
    hasCachedConnection: !!(cachedClient && cachedDb),
    lastCheck: new Date().toISOString()
  };
}

module.exports = { connectDB, getDB, getConnectionMetrics };
