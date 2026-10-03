import { API_BASE_URL, ENDPOINTS } from '../constants/apiEndpoints';

/**
 * Global API Configuration and interceptor logic using native fetch.
 * Handles base URLs, default headers, token injection, and token refresh.
 */

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const getAuthToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');
const getRefreshToken = () => localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');

const updateTokens = (token, refreshToken) => {
  if (localStorage.getItem('token') || localStorage.getItem('refreshToken')) {
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
  }
  if (sessionStorage.getItem('token') || sessionStorage.getItem('refreshToken')) {
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('refreshToken', refreshToken);
  }
};

const clearTokens = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('refreshToken');
};

export const fetchApi = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const { requireAuth = true, responseType = 'json', ...restOptions } = options;

  // Set up default headers
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...restOptions.headers,
  };

  // Inject Authorization token if it exists and requiresAuth is true
  if (requireAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const config = {
    ...restOptions,
    headers,
  };

  try {
    let response = await fetch(url, config);

    // Handle Unauthorized errors by refreshing token
    if (response.status === 401 && requireAuth) {
      const refreshToken = getRefreshToken();
      
      if (!refreshToken) {
        clearTokens();
        window.location.href = '/login';
        throw new Error('Unauthorized');
      }

      if (isRefreshing) {
        try {
          const newToken = await new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          });
          config.headers['Authorization'] = `Bearer ${newToken}`;
          response = await fetch(url, config);
        } catch (err) {
          throw err;
        }
      } else {
        isRefreshing = true;
        try {
          const refreshUrl = `${API_BASE_URL}${ENDPOINTS.AUTH.REFRESH_TOKEN}`;
          const refreshResponse = await fetch(refreshUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': '*/*' },
            body: JSON.stringify({ refreshToken })
          });
          
          const refreshData = await refreshResponse.json().catch(() => ({}));
          
          if (refreshResponse.ok && refreshData?.response?.token) {
            const newToken = refreshData.response.token;
            const newRefreshToken = refreshData.response.refreshToken || refreshToken;
            
            updateTokens(newToken, newRefreshToken);
            processQueue(null, newToken);
            
            config.headers['Authorization'] = `Bearer ${newToken}`;
            response = await fetch(url, config);
          } else {
            throw new Error('Refresh token invalid');
          }
        } catch (error) {
          processQueue(error, null);
          clearTokens();
          window.location.href = '/login';
          throw error;
        } finally {
          isRefreshing = false;
        }
      }
    }

    // Handle binary responses (e.g. PDF)
    if (responseType === 'blob') {
      if (!response.ok) {
        throw new Error(`Failed to fetch blob: ${response.statusText}`);
      }
      return await response.blob();
    }

    // Parse JSON for typical API responses
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw {
        status: response.status,
        message: data.message || 'Something went wrong',
        data
      };
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};
