// API service for Public Site - connects to serverless functions
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';
// Static files base URL (without /api suffix) for images
export const STATIC_BASE_URL = typeof window !== 'undefined' 
  ? `${window.location.protocol}//${window.location.host}`
  : '';

class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse(response: Response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new ApiError(error.error || `HTTP ${response.status}`, response.status);
  }
  return response.json();
}

// Public API for Resolutions
export const resolutionsApi = {
  getAll: async (params?: { search?: string; series?: string; page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.series) queryParams.append('series', params.series);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const response = await fetch(`${API_BASE_URL}/resolutions?${queryParams}`);
    return handleResponse(response);
  },
  getPdfUrl: (id: string, download?: boolean) => {
    const queryParams = new URLSearchParams();
    queryParams.append('id', id);
    if (download) queryParams.append('download', 'true');
    return `${API_BASE_URL}/resolutions?${queryParams}`;
  },
  viewPdf: (id: string) => {
    window.open(resolutionsApi.getPdfUrl(id), '_blank');
  },
  downloadPdf: (id: string, resolutionNumber: string, series: string) => {
    const link = document.createElement('a');
    link.href = resolutionsApi.getPdfUrl(id, true);
    link.download = `Resolution-${resolutionNumber}-${series}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Public API for Ordinances
export const ordinancesApi = {
  getAll: async (params?: { search?: string; series?: string; page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.series) queryParams.append('series', params.series);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const response = await fetch(`${API_BASE_URL}/ordinances?${queryParams}`);
    return handleResponse(response);
  },
  getPdfUrl: (id: string, download?: boolean) => {
    const queryParams = new URLSearchParams();
    queryParams.append('id', id);
    if (download) queryParams.append('download', 'true');
    return `${API_BASE_URL}/ordinances?${queryParams}`;
  },
  viewPdf: (id: string) => {
    window.open(ordinancesApi.getPdfUrl(id), '_blank');
  },
  downloadPdf: (id: string, ordinanceNumber: string, series: string) => {
    const link = document.createElement('a');
    link.href = ordinancesApi.getPdfUrl(id, true);
    link.download = `Ordinance-${ordinanceNumber}-${series}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Public API for Vacancies
export const vacanciesApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/vacancies`);
    return handleResponse(response);
  }
};

// Public API for Announcements
export const announcementsApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/announcements`);
    return handleResponse(response);
  }
};

// Public API for News
export const newsApi = {
  getAll: async (params?: { category?: string; page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const response = await fetch(`${API_BASE_URL}/news?${queryParams}`);
    return handleResponse(response);
  }
};

// Public API for Organization Members
export const organizationApi = {
  getPublic: async (params?: { category?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    const response = await fetch(`${API_BASE_URL}/organization?${queryParams}`);
    return handleResponse(response);
  }
};

// Public API for Calendar Events
export const calendarApi = {
  getPublic: async (params?: { upcoming?: boolean; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.upcoming) queryParams.append('upcoming', 'true');
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    const response = await fetch(`${API_BASE_URL}/calendar?${queryParams}`);
    return handleResponse(response);
  }
};

// Public API for Settings
export const settingsApi = {
  getPublicConfig: async () => {
    const response = await fetch(`${API_BASE_URL}/settings`);
    return handleResponse(response);
  }
};

// Public API for Contact
export const contactApi = {
  submit: async (data: { name: string; email: string; phone?: string; subject: string; message: string }) => {
    const response = await fetch(`${API_BASE_URL}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  }
};

// Public API for Applications
export const applicationsApi = {
  submit: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  }
};

// Public API for Resolutions Page
export const resolutionsPageApi = {
  getResolution: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/resolutions/${id}`);
    return handleResponse(response);
  },
  renderResolution: (resolution: any) => {
    return (
      <div className="p-6">
        <div className="text-center mb-6">
          <p className="text-sm text-gray-600">Republic of the Philippines</p>
          <p className="text-sm text-gray-600">Province of Southern Leyte</p>
          <p className="text-sm text-gray-600">Municipality of San Francisco</p>
          <p className="font-semibold text-gray-900 mt-2">SANGGUNIANG BAYAN</p>
        </div>
        <div className="mb-4">
          <span className="inline-block px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded">
            Resolution No. {resolution.resolutionNumber}, Series {resolution.series}
          </span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {resolution.title}
        </h3>
        <div 
          className="prose max-w-none mb-6 text-gray-700 resolution-content"
          dangerouslySetInnerHTML={{ 
            __html: resolution.content?.replace(
              /src="\/uploads\//g, 
              `src="${STATIC_BASE_URL}/uploads/`
            ) || '' 
          }}
        />
      </div>
    );
  }
};
