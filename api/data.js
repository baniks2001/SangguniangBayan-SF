/**
 * Consolidated Data API - All public GET endpoints in one function
 * Handles: announcements, calendar, documents, news, ordinances, organization, procurements, resolutions, vacancies
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
    await connectDB();
    const db = getDB();

    // Get the endpoint from query param or path
    const { endpoint, ...params } = req.query;
    const pathEndpoint = req.url.split('?')[0].split('/').pop();
    const target = endpoint || pathEndpoint;

    switch (target) {
      case 'announcements':
        return await handleAnnouncements(db, params, res);
      case 'calendar':
        return await handleCalendar(db, params, res);
      case 'documents':
        return await handleDocuments(db, params, res);
      case 'news':
        return await handleNews(db, params, res);
      case 'ordinances':
        return await handleOrdinances(db, params, res);
      case 'organization':
        return await handleOrganization(db, params, res);
      case 'procurements':
        return await handleProcurements(db, params, res);
      case 'resolutions':
        return await handleResolutions(db, params, res);
      case 'vacancies':
        return await handleVacancies(db, params, res);
      default:
        return res.status(400).json({ error: 'Invalid endpoint', available: ['announcements', 'calendar', 'documents', 'news', 'ordinances', 'organization', 'procurements', 'resolutions', 'vacancies'] });
    }
  } catch (error) {
    console.error('Data API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Handler functions for each endpoint
async function handleAnnouncements(db, params, res) {
  const announcements = await db.collection('announcements')
    .find({ isActive: true })
    .sort({ priority: -1, createdAt: -1 })
    .toArray();
  
  res.json({
    announcements: announcements.map(doc => ({ ...doc, id: doc._id.toString(), _id: undefined }))
  });
}

async function handleCalendar(db, params, res) {
  const { upcoming, limit = '50' } = params;
  let query = {};
  
  if (upcoming === 'true') {
    query.date = { $gte: new Date().toISOString().split('T')[0] };
  }
  
  const events = await db.collection('calendar_events')
    .find(query)
    .sort({ date: 1 })
    .limit(parseInt(limit))
    .toArray();
  
  res.json({
    events: events.map(doc => ({ ...doc, id: doc._id.toString(), _id: undefined }))
  });
}

async function handleDocuments(db, params, res) {
  const { category, search, page = '1', limit = '10' } = params;
  
  let query = { isPublic: true };
  if (category) query.category = category;
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const [documents, total] = await Promise.all([
    db.collection('documents').find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).toArray(),
    db.collection('documents').countDocuments(query)
  ]);
  
  res.json({
    documents: documents.map(doc => ({ ...doc, id: doc._id.toString(), _id: undefined })),
    pagination: { total: Math.ceil(total / parseInt(limit)), page: parseInt(page), limit: parseInt(limit), totalItems: total }
  });
}

async function handleNews(db, params, res) {
  const { category, page = '1', limit = '10' } = params;
  
  let query = { isPublished: true };
  if (category) query.category = category;
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const [news, total] = await Promise.all([
    db.collection('news').find(query).sort({ publishedAt: -1 }).skip(skip).limit(parseInt(limit)).toArray(),
    db.collection('news').countDocuments(query)
  ]);
  
  res.json({
    news: news.map(doc => ({ ...doc, id: doc._id.toString(), _id: undefined })),
    pagination: { total: Math.ceil(total / parseInt(limit)), page: parseInt(page), limit: parseInt(limit), totalItems: total }
  });
}

async function handleOrdinances(db, params, res) {
  const { search, series, page = '1', limit = '10', status, isPublic } = params;
  
  let query = {};
  if (isPublic !== undefined) query.isPublic = isPublic === 'true';
  if (status) query.status = status;
  if (series) query.series = series;
  if (search) {
    query.$or = [
      { ordinanceNumber: { $regex: search, $options: 'i' } },
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const [ordinances, total] = await Promise.all([
    db.collection('ordinances').find(query).sort({ series: -1, ordinanceNumber: -1 }).skip(skip).limit(parseInt(limit)).toArray(),
    db.collection('ordinances').countDocuments(query)
  ]);
  
  res.json({
    ordinances: ordinances.map(doc => ({ ...doc, id: doc._id.toString(), _id: undefined })),
    pagination: { total: Math.ceil(total / parseInt(limit)), page: parseInt(page), limit: parseInt(limit), totalItems: total }
  });
}

async function handleOrganization(db, params, res) {
  const { category } = params;
  
  let query = { isActive: true };
  if (category) query.category = category;
  
  const members = await db.collection('organization_members')
    .find(query)
    .sort({ displayOrder: 1, name: 1 })
    .toArray();
  
  res.json({
    members: members.map(doc => ({ ...doc, id: doc._id.toString(), _id: undefined }))
  });
}

async function handleProcurements(db, params, res) {
  const { category, year, page = '1', limit = '10' } = params;
  
  let query = { isActive: true };
  if (category) query.category = category;
  if (year) query.year = year;
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const [procurements, total] = await Promise.all([
    db.collection('procurements').find(query).sort({ date: -1 }).skip(skip).limit(parseInt(limit)).toArray(),
    db.collection('procurements').countDocuments(query)
  ]);
  
  res.json({
    procurements: procurements.map(doc => ({ ...doc, id: doc._id.toString(), _id: undefined })),
    pagination: { total: Math.ceil(total / parseInt(limit)), page: parseInt(page), limit: parseInt(limit), totalItems: total }
  });
}

async function handleResolutions(db, params, res) {
  const { search, series, page = '1', limit = '10', status, isPublic } = params;
  
  let query = {};
  if (isPublic !== undefined) query.isPublic = isPublic === 'true';
  if (status) query.status = status;
  if (series) query.series = series;
  if (search) {
    query.$or = [
      { resolutionNumber: { $regex: search, $options: 'i' } },
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const [resolutions, total] = await Promise.all([
    db.collection('resolutions').find(query).sort({ series: -1, resolutionNumber: -1 }).skip(skip).limit(parseInt(limit)).toArray(),
    db.collection('resolutions').countDocuments(query)
  ]);
  
  res.json({
    resolutions: resolutions.map(doc => ({ ...doc, id: doc._id.toString(), _id: undefined })),
    pagination: { total: Math.ceil(total / parseInt(limit)), page: parseInt(page), limit: parseInt(limit), totalItems: total }
  });
}

async function handleVacancies(db, params, res) {
  // Filter for active vacancies - admin-site saves status as "Active" (no isActive field)
  let vacancies = await db.collection('vacancies')
    .find({ status: { $regex: '^active$', $options: 'i' } })
    .sort({ createdAt: -1 })
    .toArray();
  
  // If no active vacancies, return all vacancies for debugging
  if (vacancies.length === 0) {
    console.log('No active vacancies found, checking all vacancies...');
    const allVacancies = await db.collection('vacancies').find({}).toArray();
    console.log(`Total vacancies in DB: ${allVacancies.length}`);
    if (allVacancies.length > 0) {
      console.log('Sample vacancy fields:', Object.keys(allVacancies[0]));
      console.log('Sample vacancy status:', allVacancies[0].status);
    }
  }
  
  res.json({
    vacancies: vacancies.map(doc => ({ ...doc, id: doc._id.toString(), _id: undefined }))
  });
}
