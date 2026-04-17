/**
 * Search Microservice - Full-text search across ordinances, resolutions, documents, news
 * Supports: text search, category filtering, pagination, sorting
 */

const { connectDB, getDB } = require('./database');

// Create text indexes on startup
async function ensureIndexes(db) {
  try {
    // Ordinances text index
    await db.collection('ordinances').createIndex({
      title: 'text',
      description: 'text',
      ordinanceNumber: 'text'
    }, { name: 'ordinances_text_index', background: true });

    // Resolutions text index
    await db.collection('resolutions').createIndex({
      title: 'text',
      description: 'text',
      resolutionNumber: 'text'
    }, { name: 'resolutions_text_index', background: true });

    // Documents text index
    await db.collection('documents').createIndex({
      title: 'text',
      description: 'text'
    }, { name: 'documents_text_index', background: true });

    // News text index
    await db.collection('news').createIndex({
      title: 'text',
      content: 'text',
      summary: 'text'
    }, { name: 'news_text_index', background: true });

    console.log('[Search] Text indexes ensured');
  } catch (error) {
    console.error('[Search] Index creation error:', error.message);
  }
}

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
    
    // Ensure indexes exist
    await ensureIndexes(db);

    const { 
      q, 
      type, 
      page = '1', 
      limit = '10',
      sort = 'relevance',
      series,
      year,
      status
    } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ 
        error: 'Search query required (min 2 characters)',
        example: '/api/search?q=traffic&page=1&limit=10'
      });
    }

    const searchTerm = q.trim();
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Define which collections to search
    const collections = type 
      ? [type] 
      : ['ordinances', 'resolutions', 'documents', 'news'];

    const validCollections = ['ordinances', 'resolutions', 'documents', 'news'];
    const searchCollections = collections.filter(c => validCollections.includes(c));

    if (searchCollections.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid type. Valid types: ordinances, resolutions, documents, news' 
      });
    }

    // Build aggregation pipeline for each collection
    const searchPromises = searchCollections.map(async (collectionName) => {
      const collection = db.collection(collectionName);
      
      // Base match: text search + filters
      const matchStage = {
        $and: [
          { $text: { $search: searchTerm } },
          collectionName === 'ordinances' || collectionName === 'resolutions' 
            ? { isPublic: true } 
            : collectionName === 'news' 
              ? { isPublished: true }
              : { isPublic: true }
        ]
      };

      // Add series filter for legislative docs
      if (series && (collectionName === 'ordinances' || collectionName === 'resolutions')) {
        matchStage.$and.push({ series });
      }

      // Add year filter
      if (year) {
        matchStage.$and.push({ 
          $or: [
            { year: year },
            { series: { $regex: year } },
            { createdAt: { $regex: `^${year}` } }
          ]
        });
      }

      // Add status filter
      if (status) {
        matchStage.$and.push({ status });
      }

      const pipeline = [
        { $match: matchStage },
        {
          $addFields: {
            searchScore: { $meta: 'textScore' },
            type: collectionName
          }
        },
        {
          $project: {
            _id: 0,
            id: { $toString: '$_id' },
            title: 1,
            description: 1,
            type: 1,
            searchScore: 1,
            createdAt: 1,
            // Collection-specific fields
            ...(collectionName === 'ordinances' && {
              ordinanceNumber: 1,
              series: 1,
              pdfFileId: 1
            }),
            ...(collectionName === 'resolutions' && {
              resolutionNumber: 1,
              series: 1,
              pdfFileId: 1
            }),
            ...(collectionName === 'documents' && {
              category: 1,
              fileId: 1,
              fileName: 1
            }),
            ...(collectionName === 'news' && {
              category: 1,
              summary: 1,
              featuredImage: 1,
              publishedAt: 1
            })
          }
        }
      ];

      const results = await collection.aggregate(pipeline).toArray();
      return results;
    });

    // Execute all searches in parallel
    const allResults = await Promise.all(searchPromises);
    let combinedResults = allResults.flat();

    // Calculate total before slicing
    const totalResults = combinedResults.length;

    // Sort results
    if (sort === 'relevance') {
      combinedResults.sort((a, b) => b.searchScore - a.searchScore);
    } else if (sort === 'date') {
      combinedResults.sort((a, b) => new Date(b.createdAt || b.publishedAt) - new Date(a.createdAt || a.publishedAt));
    } else if (sort === 'title') {
      combinedResults.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }

    // Paginate
    const paginatedResults = combinedResults.slice(skip, skip + limitNum);

    // Group by type for easier frontend consumption
    const groupedByType = paginatedResults.reduce((acc, item) => {
      if (!acc[item.type]) acc[item.type] = [];
      acc[item.type].push(item);
      return acc;
    }, {});

    res.json({
      query: searchTerm,
      total: totalResults,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalResults / limitNum),
      results: paginatedResults,
      groupedByType,
      facets: {
        ordinances: combinedResults.filter(r => r.type === 'ordinances').length,
        resolutions: combinedResults.filter(r => r.type === 'resolutions').length,
        documents: combinedResults.filter(r => r.type === 'documents').length,
        news: combinedResults.filter(r => r.type === 'news').length
      }
    });

  } catch (error) {
    console.error('[Search API] Error:', error);
    res.status(500).json({ 
      error: 'Search failed',
      details: error.message 
    });
  }
};
