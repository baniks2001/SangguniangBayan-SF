// API service for Public Site - connects to serverless functions
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

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
    const response = await fetch(`${API_BASE_URL}/organization/public/all?${queryParams}`);
    return handleResponse(response);
  }
};

// Public API for Calendar Events
export const calendarApi = {
  getPublic: async (params?: { upcoming?: boolean; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.upcoming) queryParams.append('upcoming', 'true');
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    const response = await fetch(`${API_BASE_URL}/calendar/public/all?${queryParams}`);
    return handleResponse(response);
  }
};

// Public API for Settings
export const settingsApi = {
  getPublicConfig: async () => {
    const response = await fetch(`${API_BASE_URL}/settings/public/config`);
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
