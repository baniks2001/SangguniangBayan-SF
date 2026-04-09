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
  // View PDF in new tab (uses GridFS fileId)
  viewPdf: (fileId: string | undefined) => {
    if (!fileId) {
      console.error('No file ID available');
      return;
    }
    // Use the consolidated file endpoint
    const url = `/api/file?id=${fileId}`;
    window.open(url, '_blank');
  },
  // Download PDF with custom filename (uses GridFS fileId)
  downloadPdf: (fileId: string | undefined, resolutionNumber: string, series: string) => {
    if (!fileId) {
      console.error('No file ID available');
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
  // View PDF in new tab (uses GridFS fileId)
  viewPdf: (fileId: string | undefined) => {
    if (!fileId) {
      console.error('No file ID available');
      return;
    }
    // Use the consolidated file endpoint
    const url = `/api/file?id=${fileId}`;
    window.open(url, '_blank');
  },
  // Download PDF with custom filename (uses GridFS fileId)
  downloadPdf: (fileId: string | undefined, ordinanceNumber: string, series: string) => {
    if (!fileId) {
      console.error('No file ID available');
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
  // Get full URL for document file
  getFileUrl: (fileUrl: string | undefined) => {
    if (!fileUrl) return null;
    if (fileUrl.startsWith('http')) return fileUrl;
    return `${STATIC_BASE_URL}${fileUrl}`;
  },
  // View document in new tab
  viewFile: (fileUrl: string | undefined) => {
    const fullUrl = documentsApi.getFileUrl(fileUrl);
    if (fullUrl) {
      window.open(fullUrl, '_blank');
    } else {
      console.error('No file URL available');
    }
  },
  // Download document
  downloadFile: (fileUrl: string | undefined, fileName: string) => {
    const fullUrl = documentsApi.getFileUrl(fileUrl);
    if (!fullUrl) {
      console.error('No file URL available');
      return;
    }
    const link = document.createElement('a');
    link.href = fullUrl;
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
