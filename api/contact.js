/**
 * Contact API - Public endpoint
 * Based on admin-site routes/contact.js pattern
 * 
 * POST /api/contact - Submit contact form
 */

const { connectDB, getDB } = require('./database');

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, subject, message, phone } = req.body;

    // Validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        fields: ['name', 'email', 'subject', 'message']
      });
    }

    // Admin-site pattern: connect first, then getDB
    await connectDB();
    const db = getDB();
    const collection = db.collection('contacts');

    // Insert (admin-site pattern)
    const result = await collection.insertOne({
      name,
      email,
      phone: phone || '',
      subject,
      message,
      status: 'unread',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    res.status(201).json({
      message: 'Contact form submitted successfully',
      id: result.insertedId.toString()
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Failed to submit contact form',
      details: error.message
    });
  }
};
