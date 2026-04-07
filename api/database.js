/**
 * Database configuration for public-site serverless functions
 * Based on admin-site config/database.js pattern
 * 
 * This module provides MongoDB connection management with caching
 * for Vercel serverless functions.
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'sangguniang_bayan';

// Global cached connection for serverless (module-level variables)
let client = null;
let db = null;

/**
 * Connect to MongoDB Atlas
 * @returns {Promise<{client: MongoClient, db: Db}>}
 */
async function connectDB() {
  if (client && db) {
    return { client, db };
  }

  try {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(MONGODB_DB_NAME);

    console.log('Connected to MongoDB Atlas');
    return { client, db };
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

/**
 * Get the database instance (must call connectDB first)
 * @returns {Db}
 */
function getDB() {
  if (!db) {
    throw new Error('Database not connected. Call connectDB() first.');
  }
  return db;
}

/**
 * Get the MongoDB client (must call connectDB first)
 * @returns {MongoClient}
 */
function getClient() {
  if (!client) {
    throw new Error('MongoDB client not connected. Call connectDB() first.');
  }
  return client;
}

module.exports = {
  connectDB,
  getDB,
  getClient
};
