/**
 * Apply API - Public endpoint
 * Based on admin-site routes/applications.js pattern
 * 
 * POST /api/apply - Submit job application
 */

const { connectDB, getDB } = require('./database');
const { ObjectId } = require('mongodb');

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
    const { 
      vacancyId, fullName, age, mobileNumber, email, address,
      education, experience, certifications, coverLetter,
      resumeUrl, certificateUrls
    } = req.body;

    // Validation
    if (!vacancyId || !fullName || !age || !mobileNumber || !email || !address) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['vacancyId', 'fullName', 'age', 'mobileNumber', 'email', 'address']
      });
    }

    // Admin-site pattern: connect first, then getDB
    await connectDB();
    const db = getDB();
    const applicationsCollection = db.collection('applications');
    const vacanciesCollection = db.collection('vacancies');

    // Verify vacancy is active (admin-site pattern)
    const vacancy = await vacanciesCollection.findOne({ 
      _id: new ObjectId(vacancyId),
      status: 'Active'
    });

    if (!vacancy) {
      return res.status(404).json({ error: 'Vacancy not found or no longer active' });
    }

    // Insert application (admin-site pattern)
    const result = await applicationsCollection.insertOne({
      vacancyId,
      vacancyTitle: vacancy.jobTitle || vacancy.position,
      fullName,
      age: Number(age),
      mobileNumber,
      email,
      address,
      education: education || '',
      experience: experience || '',
      certifications: certifications || '',
      coverLetter: coverLetter || '',
      resumeUrl: resumeUrl || '',
      certificateUrls: certificateUrls || [],
      status: 'Pending',
      submittedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    res.status(201).json({
      message: 'Application submitted successfully',
      id: result.insertedId.toString()
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Failed to submit application',
      details: error.message
    });
  }
};
