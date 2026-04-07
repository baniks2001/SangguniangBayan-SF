/**
 * Settings API - Public endpoint
 * Based on admin-site routes/settings.js pattern
 * 
 * GET /api/settings - Get public settings
 */

const { connectDB, getDB } = require('./database');

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
    // Admin-site pattern: connect first, then getDB
    await connectDB();
    const db = getDB();
    const collection = db.collection('settings');

    // Get all settings
    const settings = await collection.find({}).toArray();
    
    // Convert to key-value object (admin-site pattern)
    const settingsMap = {};
    settings.forEach(setting => {
      settingsMap[setting.key] = setting.value;
    });

    // Default settings
    const defaults = {
      municipalityName: 'San Francisco',
      provinceName: 'Southern Leyte',
      sbTitle: 'Sangguniang Bayan',
      officeLocation: 'Municipal Hall, San Francisco, Southern Leyte',
      contactEmail: 'sb.sanfrancisco@gmail.com',
      contactPhone: '(053) 514-1234',
      officeHours: 'Monday - Friday, 8:00 AM - 5:00 PM'
    };

    res.status(200).json({ 
      settings: { ...defaults, ...settingsMap }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch settings',
      details: error.message
    });
  }
};
