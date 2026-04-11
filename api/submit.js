/**
 * Consolidated Submit API - All POST endpoints in one function
 * Handles: apply (job applications), contact (contact form)
 */

const { connectDB, getDB } = require('./database');
const { ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Parse multipart form data manually for serverless
const parseFormData = (req) => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      const buffer = Buffer.concat(chunks);
      resolve(buffer);
    });
    req.on('error', reject);
  });
};

// Simple multipart parser
const parseMultipart = (buffer, boundary) => {
  const parts = [];
  const boundaryBuffer = Buffer.from('--' + boundary);
  let start = buffer.indexOf(boundaryBuffer);
  
  while (start !== -1) {
    let end = buffer.indexOf(boundaryBuffer, start + boundaryBuffer.length);
    if (end === -1) break;
    
    const part = buffer.slice(start + boundaryBuffer.length, end);
    const headerEnd = part.indexOf('\r\n\r\n');
    
    if (headerEnd !== -1) {
      const header = part.slice(0, headerEnd).toString();
      const content = part.slice(headerEnd + 4, part.length - 2);
      
      const nameMatch = header.match(/name="([^"]+)"/);
      const filenameMatch = header.match(/filename="([^"]+)"/);
      
      parts.push({
        name: nameMatch ? nameMatch[1] : null,
        filename: filenameMatch ? filenameMatch[1] : null,
        content: content,
        isFile: !!filenameMatch
      });
    }
    
    start = end;
  }
  
  return parts;
};

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
    // Get the endpoint from query param or path
    const { endpoint } = req.query;
    const pathEndpoint = req.url.split('?')[0].split('/').pop();
    const target = endpoint || pathEndpoint;

    await connectDB();

    switch (target) {
      case 'apply':
        return await handleApply(req, res);
      case 'contact':
        return await handleContact(req, res);
      default:
        return res.status(400).json({ error: 'Invalid endpoint', available: ['apply', 'contact'] });
    }
  } catch (error) {
    console.error('Submit API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Handle job application submission
async function handleApply(req, res) {
  const contentType = req.headers['content-type'] || '';
  let applicationData = {};
  
  // Multiple file upload fields
  let resumeUrl = '';
  let certificateUrls = [];
  let governmentIdUrl = '';
  let diplomaUrl = '';
  let transcriptUrl = '';
  let nbiClearanceUrl = '';
  let policeClearanceUrl = '';
  let barangayClearanceUrl = '';
  let medicalCertificateUrl = '';
  let otherDocumentUrls = [];

  // Handle multipart form data (file uploads)
  if (contentType.includes('multipart/form-data')) {
    const boundary = contentType.split('boundary=')[1];
    const buffer = await parseFormData(req);
    const parts = parseMultipart(buffer, boundary);
    
    // Ensure uploads directory exists
    const uploadDir = path.join('/tmp', 'uploads', 'applications');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    for (const part of parts) {
      if (part.isFile && part.content.length > 0) {
        // Save file
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}-${part.filename}`;
        const filePath = path.join(uploadDir, uniqueName);
        fs.writeFileSync(filePath, part.content);
        
        // Store file URL
        const fileUrl = `/uploads/applications/${uniqueName}`;
        
        // Handle multiple file field names
        switch (part.name) {
          case 'resume':
          case 'cv':
            resumeUrl = fileUrl;
            break;
          case 'certificates':
          case 'certificate':
            certificateUrls.push(fileUrl);
            break;
          case 'governmentId':
          case 'validId':
          case 'id':
            governmentIdUrl = fileUrl;
            break;
          case 'diploma':
          case 'degree':
            diplomaUrl = fileUrl;
            break;
          case 'transcript':
          case 'tor':
            transcriptUrl = fileUrl;
            break;
          case 'nbiClearance':
            nbiClearanceUrl = fileUrl;
            break;
          case 'policeClearance':
            policeClearanceUrl = fileUrl;
            break;
          case 'barangayClearance':
            barangayClearanceUrl = fileUrl;
            break;
          case 'medicalCertificate':
            medicalCertificateUrl = fileUrl;
            break;
          case 'otherDocuments':
          case 'others':
            otherDocumentUrls.push(fileUrl);
            break;
        }
      } else if (part.name && !part.isFile) {
        // Form field
        applicationData[part.name] = part.content.toString();
      }
    }
  } else {
    // Handle JSON data (no files)
    const body = await new Promise((resolve, reject) => {
      let data = '';
      req.on('data', chunk => data += chunk);
      req.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({});
        }
      });
      req.on('error', reject);
    });
    applicationData = body;
    resumeUrl = body.resumeUrl || body.cvUrl || '';
    certificateUrls = body.certificateUrls || body.certificates || [];
    governmentIdUrl = body.governmentIdUrl || body.idUrl || '';
    diplomaUrl = body.diplomaUrl || '';
    transcriptUrl = body.transcriptUrl || body.torUrl || '';
    nbiClearanceUrl = body.nbiClearanceUrl || '';
    policeClearanceUrl = body.policeClearanceUrl || '';
    barangayClearanceUrl = body.barangayClearanceUrl || '';
    medicalCertificateUrl = body.medicalCertificateUrl || '';
    otherDocumentUrls = body.otherDocumentUrls || body.others || [];
  }

  const { 
    vacancyId, fullName, age, mobileNumber, email, address,
    education, experience, certifications, coverLetter
  } = applicationData;

  // Validation
  if (!vacancyId || !fullName || !age || !mobileNumber || !email || !address) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      required: ['vacancyId', 'fullName', 'age', 'mobileNumber', 'email', 'address']
    });
  }

  const db = getDB();
  const applicationsCollection = db.collection('applications');
  const vacanciesCollection = db.collection('vacancies');

  // Verify vacancy is active
  const vacancy = await vacanciesCollection.findOne({ 
    _id: new ObjectId(vacancyId),
    status: 'Active'
  });

  if (!vacancy) {
    return res.status(404).json({ error: 'Vacancy not found or no longer active' });
  }

  // Insert application with new status 'New Applicant' and all document URLs
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
    // All document uploads
    resumeUrl: resumeUrl || '',
    certificateUrls: certificateUrls || [],
    governmentIdUrl: governmentIdUrl || '',
    diplomaUrl: diplomaUrl || '',
    transcriptUrl: transcriptUrl || '',
    nbiClearanceUrl: nbiClearanceUrl || '',
    policeClearanceUrl: policeClearanceUrl || '',
    barangayClearanceUrl: barangayClearanceUrl || '',
    medicalCertificateUrl: medicalCertificateUrl || '',
    otherDocumentUrls: otherDocumentUrls || [],
    // Application status workflow
    status: 'New Applicant', // New status: New Applicant, Pending, In Process, Rejected, Accepted
    statusHistory: [{
      status: 'New Applicant',
      date: new Date(),
      notes: 'Application submitted'
    }],
    submittedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  });

  res.status(201).json({
    message: 'Application submitted successfully',
    id: result.insertedId.toString()
  });
}

// Handle contact form submission
async function handleContact(req, res) {
  const contentType = req.headers['content-type'] || '';
  let contactData = {};
  let imageUrls = [];

  // Handle multipart form data (file uploads for complaints)
  if (contentType.includes('multipart/form-data')) {
    const boundary = contentType.split('boundary=')[1];
    const buffer = await parseFormData(req);
    const parts = parseMultipart(buffer, boundary);
    
    // Ensure uploads directory exists
    const uploadDir = path.join('/tmp', 'uploads', 'contacts');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    for (const part of parts) {
      if (part.isFile && part.content.length > 0) {
        // Save file
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}-${part.filename}`;
        const filePath = path.join(uploadDir, uniqueName);
        fs.writeFileSync(filePath, part.content);
        
        // Store file URL
        const fileUrl = `/uploads/contacts/${uniqueName}`;
        imageUrls.push(fileUrl);
      } else if (part.name && !part.isFile) {
        // Form field
        contactData[part.name] = part.content.toString();
      }
    }
  } else {
    // Handle JSON data (no files)
    const body = await new Promise((resolve, reject) => {
      let data = '';
      req.on('data', chunk => data += chunk);
      req.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({});
        }
      });
      req.on('error', reject);
    });
    contactData = body;
  }

  const { name, email, subjectType, message, phone } = contactData;

  // Validation
  if (!name || !email || !subjectType || !message) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      fields: ['name', 'email', 'subjectType', 'message']
    });
  }

  // If complain, require at least 3 images
  if (subjectType === 'Complain' && imageUrls.length < 3) {
    return res.status(400).json({
      error: 'Complaints require at least 3 images',
      requiredImages: 3,
      providedImages: imageUrls.length
    });
  }

  const db = getDB();
  const collection = db.collection('contacts');

  // Insert
  const result = await collection.insertOne({
    name,
    email,
    phone: phone || '',
    subjectType,
    subject: subjectType, // Keep for backward compatibility
    message,
    images: imageUrls,
    status: 'unread',
    createdAt: new Date(),
    updatedAt: new Date()
  });

  res.status(201).json({
    message: 'Contact form submitted successfully',
    id: result.insertedId.toString()
  });
}
