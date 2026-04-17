// API service for Public Site - uses local serverless API endpoints
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
// Static files base URL (for PDFs from admin backend)
export const STATIC_BASE_URL = API_BASE_URL.replace('/api', '');

class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse(response: Response) {
  if (!response.ok) {
    const text = await response.text();
    console.error('API Error:', response.status, text);
    throw new ApiError(`HTTP ${response.status}: ${text}`, response.status);
  }
  return response.json();
}

// Public API for Resolutions - uses local serverless function
export const resolutionsApi = {
  getAll: async (params?: { search?: string; series?: string; page?: number; limit?: number; status?: string; isPublic?: boolean }) => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.series) queryParams.append('series', params.series);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.isPublic !== undefined) queryParams.append('isPublic', params.isPublic.toString());
    
    // Use consolidated data endpoint
    queryParams.append('endpoint', 'resolutions');
    const response = await fetch(`/api/data?${queryParams}`);
    return handleResponse(response);
  },
  // Helper to check if value is valid ObjectId (24 hex chars)
  isValidObjectId: (id: string | undefined): boolean => {
    if (!id || typeof id !== 'string') return false;
    // MongoDB ObjectId is 24 hex characters
    return /^[0-9a-fA-F]{24}$/.test(id);
  },
  // View PDF in new tab (uses GridFS fileId)
  viewPdf: (fileId: string | undefined) => {
    if (!resolutionsApi.isValidObjectId(fileId)) {
      console.error('Invalid or missing file ID:', fileId);
      alert('No PDF file available for this resolution. Please re-upload the file.');
      return;
    }
    // Use the consolidated file endpoint
    const url = `/api/file?id=${fileId}`;
    window.open(url, '_blank');
  },
  // Download PDF with custom filename (uses GridFS fileId)
  downloadPdf: (fileId: string | undefined, resolutionNumber: string, series: string) => {
    if (!resolutionsApi.isValidObjectId(fileId)) {
      console.error('Invalid or missing file ID:', fileId);
      alert('No PDF file available for this resolution. Please re-upload the file.');
      return;
    }
    // Use the consolidated file endpoint with download flag
    const url = `/api/file?id=${fileId}&download=true`;
    const link = document.createElement('a');
    link.href = url;
    link.download = `Resolution-${resolutionNumber}-${series}.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Public API for Ordinances - uses local serverless function
export const ordinancesApi = {
  getAll: async (params?: { search?: string; series?: string; page?: number; limit?: number; status?: string; isPublic?: boolean }) => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.series) queryParams.append('series', params.series);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.isPublic !== undefined) queryParams.append('isPublic', params.isPublic.toString());
    
    // Use consolidated data endpoint
    queryParams.append('endpoint', 'ordinances');
    const response = await fetch(`/api/data?${queryParams}`);
    return handleResponse(response);
  },
  // Helper to check if value is valid ObjectId (24 hex chars)
  isValidObjectId: (id: string | undefined): boolean => {
    if (!id || typeof id !== 'string') return false;
    // MongoDB ObjectId is 24 hex characters
    return /^[0-9a-fA-F]{24}$/.test(id);
  },
  // View PDF in new tab (uses GridFS fileId)
  viewPdf: (fileId: string | undefined) => {
    if (!ordinancesApi.isValidObjectId(fileId)) {
      console.error('Invalid or missing file ID:', fileId);
      alert('No PDF file available for this ordinance. Please re-upload the file.');
      return;
    }
    // Use the consolidated file endpoint
    const url = `/api/file?id=${fileId}`;
    window.open(url, '_blank');
  },
  // Download PDF with custom filename (uses GridFS fileId)
  downloadPdf: (fileId: string | undefined, ordinanceNumber: string, series: string) => {
    if (!ordinancesApi.isValidObjectId(fileId)) {
      console.error('Invalid or missing file ID:', fileId);
      alert('No PDF file available for this ordinance. Please re-upload the file.');
      return;
    }
    // Use the consolidated file endpoint with download flag
    const url = `/api/file?id=${fileId}&download=true`;
    const link = document.createElement('a');
    link.href = url;
    link.download = `Ordinance-${ordinanceNumber}-${series}.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Public API for Documents - uses local serverless function
export const documentsApi = {
  getAll: async (params?: { search?: string; category?: string; page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    queryParams.append('endpoint', 'documents');
    const response = await fetch(`/api/data?${queryParams}`);
    return handleResponse(response);
  },
  // Helper to check if value is valid ObjectId (24 hex chars)
  isValidObjectId: (id: string | undefined): boolean => {
    if (!id || typeof id !== 'string') return false;
    // MongoDB ObjectId is 24 hex characters
    return /^[0-9a-fA-F]{24}$/.test(id);
  },
  // View document in new tab (uses GridFS fileId)
  viewFile: (fileId: string | undefined) => {
    if (!documentsApi.isValidObjectId(fileId)) {
      console.error('Invalid or missing file ID:', fileId);
      alert('No file available. Please re-upload the file.');
      return;
    }
    const url = `/api/file?id=${fileId}`;
    window.open(url, '_blank');
  },
  // Download document (uses GridFS fileId)
  downloadFile: (fileId: string | undefined, fileName: string) => {
    if (!documentsApi.isValidObjectId(fileId)) {
      console.error('Invalid or missing file ID:', fileId);
      alert('No file available. Please re-upload the file.');
      return;
    }
    const url = `/api/file?id=${fileId}&download=true`;
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Public API for Vacancies - uses local serverless function
export const vacanciesApi = {
  getAll: async () => {
    const response = await fetch('/api/data?endpoint=vacancies');
    return handleResponse(response);
  }
};

// Public API for Announcements - uses local serverless function
export const announcementsApi = {
  getAll: async () => {
    const response = await fetch('/api/data?endpoint=announcements');
    return handleResponse(response);
  }
};

// Public API for News - uses local serverless function
export const newsApi = {
  getAll: async (params?: { category?: string; page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    queryParams.append('endpoint', 'news');
    const response = await fetch(`/api/data?${queryParams}`);
    return handleResponse(response);
  }
};

// Public API for Organization Members - uses local serverless function
export const organizationApi = {
  getPublic: async (params?: { category?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    queryParams.append('endpoint', 'organization');
    const response = await fetch(`/api/data?${queryParams}`);
    return handleResponse(response);
  }
};

// Public API for Calendar Events - uses local serverless function
export const calendarApi = {
  getPublic: async (params?: { upcoming?: boolean; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.upcoming) queryParams.append('upcoming', 'true');
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    queryParams.append('endpoint', 'calendar');
    const response = await fetch(`/api/data?${queryParams}`);
    return handleResponse(response);
  }
};

// Public API for Contact - uses local serverless function
export const contactApi = {
  submit: async (data: { name: string; email: string; phone?: string; subject: string; message: string }) => {
    const response = await fetch('/api/submit?endpoint=contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  }
};

// Public API for Applications - uses local serverless function
export const applicationsApi = {
  submit: async (data: any) => {
    const response = await fetch('/api/submit?endpoint=apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },
  submitWithFile: async (formData: FormData) => {
    const response = await fetch('/api/submit?endpoint=apply', {
      method: 'POST',
      body: formData
    });
    return handleResponse(response);
  }
};

// Public API for Files (GridFS) - view and download from admin backend
export const filesApi = {
  // Build the proxy URL for viewing/downloading GridFS files
  getFileUrl: (fileId: string | undefined): string | null => {
    if (!fileId) return null;
    return `/api/file?id=${fileId}`;
  },

  // View file in new tab (works for PDFs, images)
  viewFile: (fileId: string | undefined) => {
    const url = filesApi.getFileUrl(fileId);
    if (url) {
      window.open(url, '_blank');
    } else {
      console.error('No file ID provided');
    }
  },

  // Download file with custom filename
  downloadFile: (fileId: string | undefined, fileName: string) => {
    if (!fileId) {
      console.error('No file ID provided');
      return;
    }
    
    const url = `/api/file?id=${fileId}&download=true`;
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // Get file metadata (not implemented in consolidated endpoint)
  getMetadata: async (fileId: string) => {
    throw new Error('Metadata endpoint not available in consolidated API');
  }
};

// NEW MICROSERVICES

// Search API - Full-text search across content
export const searchApi = {
  search: async (params: {
    q: string;
    type?: 'ordinances' | 'resolutions' | 'documents' | 'news';
    page?: number;
    limit?: number;
    sort?: 'relevance' | 'date' | 'title';
    series?: string;
    year?: string;
    status?: string;
  }) => {
    const queryParams = new URLSearchParams();
    queryParams.append('q', params.q);
    if (params.type) queryParams.append('type', params.type);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.sort) queryParams.append('sort', params.sort);
    if (params.series) queryParams.append('series', params.series);
    if (params.year) queryParams.append('year', params.year);
    if (params.status) queryParams.append('status', params.status);
    
    const response = await fetch(`/api/search?${queryParams}`);
    return handleResponse(response);
  }
};

// Analytics API - Track events and get stats
export const analyticsApi = {
  // Track a page view or download
  track: async (data: {
    type: 'pageview' | 'download' | 'search' | 'click';
    page?: string;
    contentType?: string;
    contentId?: string;
    contentTitle?: string;
    metadata?: Record<string, any>;
  }) => {
    const response = await fetch('/api/analytics?action=track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  // Get stats for content
  getStats: async (params?: {
    contentType?: string;
    contentId?: string;
    days?: number;
    page?: string;
    type?: 'pageview' | 'download';
  }) => {
    const queryParams = new URLSearchParams();
    queryParams.append('action', 'stats');
    if (params?.contentType) queryParams.append('contentType', params.contentType);
    if (params?.contentId) queryParams.append('contentId', params.contentId);
    if (params?.days) queryParams.append('days', params.days.toString());
    if (params?.page) queryParams.append('page', params.page);
    if (params?.type) queryParams.append('type', params.type);
    
    const response = await fetch(`/api/analytics?${queryParams}`);
    return handleResponse(response);
  },

  // Get popular content
  getPopular: async (params?: {
    contentType?: string;
    days?: number;
    limit?: number;
    metric?: 'views' | 'downloads';
  }) => {
    const queryParams = new URLSearchParams();
    queryParams.append('action', 'popular');
    if (params?.contentType) queryParams.append('contentType', params.contentType);
    if (params?.days) queryParams.append('days', params.days.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.metric) queryParams.append('metric', params.metric);
    
    const response = await fetch(`/api/analytics?${queryParams}`);
    return handleResponse(response);
  },

  // Get dashboard summary
  getDashboard: async (days?: number) => {
    const queryParams = new URLSearchParams();
    queryParams.append('action', 'dashboard');
    if (days) queryParams.append('days', days.toString());
    
    const response = await fetch(`/api/analytics?${queryParams}`);
    return handleResponse(response);
  }
};

// Rate Limit API - Check rate limits before submitting
export const rateLimitApi = {
  // Check rate limit status
  check: async (action: 'contact' | 'apply' | 'search' | 'analytics') => {
    const response = await fetch(`/api/rate-limit?action=${action}`);
    return handleResponse(response);
  },

  // Check all rate limits
  checkAll: async () => {
    const response = await fetch('/api/rate-limit?check=true');
    return handleResponse(response);
  }
};

// Image Optimization API
export const imageOptimizeApi = {
  // Get optimized image URL
  getUrl: (params: {
    id: string;
    w?: number;
    h?: number;
    q?: number;
    f?: 'jpeg' | 'png' | 'webp';
    fit?: 'cover' | 'contain' | 'fill';
  }): string => {
    const queryParams = new URLSearchParams();
    queryParams.append('id', params.id);
    if (params.w) queryParams.append('w', params.w.toString());
    if (params.h) queryParams.append('h', params.h.toString());
    if (params.q) queryParams.append('q', params.q.toString());
    if (params.f) queryParams.append('f', params.f);
    if (params.fit) queryParams.append('fit', params.fit);
    
    return `/api/image-optimize?${queryParams}`;
  }
};

// PDF Preview API
export const pdfPreviewApi = {
  // Get PDF metadata
  getMetadata: async (id: string) => {
    const response = await fetch(`/api/pdf-preview?id=${id}&type=metadata`);
    return handleResponse(response);
  },

  // Get PDF thumbnail URL
  getThumbnailUrl: (id: string, format: 'svg' | 'png' = 'svg', width?: number, height?: number): string => {
    const params = new URLSearchParams();
    params.append('id', id);
    params.append('type', 'thumbnail');
    params.append('format', format);
    if (width) params.append('w', width.toString());
    if (height) params.append('h', height.toString());
    
    return `/api/pdf-preview?${params}`;
  },

  // Get full preview data
  getPreview: async (id: string) => {
    const response = await fetch(`/api/pdf-preview?id=${id}&type=preview`);
    return handleResponse(response);
  }
};
