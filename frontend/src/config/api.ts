/**
 * API Configuration
 * Centralized configuration for backend API endpoints
 */

export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:5001',
  
  // Organization endpoints
  ORGANIZATION: {
    CHECK: (orgName: string) => `/api/organization/${encodeURIComponent(orgName)}/check`,
    CREATE: (orgName: string) => `/api/organization/${encodeURIComponent(orgName)}/create`,
    IMAGES: (orgName: string, type?: 'editor' | 'mindmapping') => {
      const base = `/api/organization/${encodeURIComponent(orgName)}/images`;
      return type ? `${base}?type=${type}` : base;
    },
    UPLOAD: (orgName: string) => `/api/organization/${encodeURIComponent(orgName)}/upload`,
    IMAGE: (orgName: string, imageId: string) => `/api/organization/${encodeURIComponent(orgName)}/image/${encodeURIComponent(imageId)}`,
    DELETE_IMAGE: (orgName: string, imageId: string) => `/api/organization/${encodeURIComponent(orgName)}/image/${encodeURIComponent(imageId)}`,
  },
  
  // Folder endpoints
  FOLDER: {
    CREATE: '/api/folder/create',
  },
  
  // Health check
  HEALTH: '/api/health',
};

/**
 * Get full API URL
 */
export const getApiUrl = (endpoint: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_CONFIG.BASE_URL}${cleanEndpoint}`;
};

/**
 * API Error handler
 */
export const handleApiError = (error: any): string => {
  if (error.response) {
    // Server responded with error status
    return error.response.data?.error || error.response.data?.message || 'An error occurred';
  } else if (error.request) {
    // Request was made but no response received
    return 'Unable to connect to the server. Please check if the backend is running.';
  } else {
    // Something else happened
    return error.message || 'An unexpected error occurred';
  }
};

