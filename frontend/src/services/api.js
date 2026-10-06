/**
 * VertAIx API Service Layer
 * Fully transitioned to FastAPI JWT authentication.
 * Manages token lifecycle, automatic token refresh, and authenticated requests.
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

const ACCESS_TOKEN_KEY = 'vertaix_access_token';
const REFRESH_TOKEN_KEY = 'vertaix_refresh_token';
const USER_KEY = 'vertaix_user';

export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);

export const setTokens = (accessToken, refreshToken, user = null) => {
  if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getStoredUser = () => {
  const data = localStorage.getItem(USER_KEY);
  try {
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * Perform an authenticated HTTP request with automatic token refresh on 401.
 */
export const authFetch = async (endpoint, options = {}) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const token = getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    let response = await fetch(url, { ...options, headers });

    // Handle token expiration / 401
    if (response.status === 401 && getRefreshToken() && !endpoint.includes('/api/auth/')) {
      if (isRefreshing) {
        // Queue pending requests while refreshing
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            headers['Authorization'] = `Bearer ${newToken}`;
            return fetch(url, { ...options, headers });
          })
          .then((res) => res.json());
      }

      isRefreshing = true;
      try {
        const refreshResponse = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: getRefreshToken() }),
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          setTokens(refreshData.access_token, refreshData.refresh_token, refreshData.user);
          processQueue(null, refreshData.access_token);

          // Retry initial failed request with new access token
          headers['Authorization'] = `Bearer ${refreshData.access_token}`;
          response = await fetch(url, { ...options, headers });
        } else {
          clearTokens();
          processQueue(new Error('Session expired'), null);
          window.dispatchEvent(new CustomEvent('vertaix:unauthorized'));
          throw new Error('Session expired. Please log in again.');
        }
      } catch (refreshErr) {
        clearTokens();
        processQueue(refreshErr, null);
        window.dispatchEvent(new CustomEvent('vertaix:unauthorized'));
        throw refreshErr;
      } finally {
        isRefreshing = false;
      }
    }

    return response;
  } catch (error) {
    console.error(`[API Error] ${endpoint}:`, error);
    throw error;
  }
};

// ==========================================
// AUTHENTICATION API
// ==========================================

export const loginUser = async (usernameOrEmail, password) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: usernameOrEmail, password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || 'Login failed');
  }

  setTokens(data.access_token, data.refresh_token, data.user);
  return data;
};

export const registerUser = async (username, email, password) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });

  const data = await response.json();
  if (!response.ok) {
    let errorMsg = 'Registration failed';
    if (typeof data.detail === 'string') {
      errorMsg = data.detail;
    } else if (Array.isArray(data.detail)) {
      errorMsg = data.detail.map((d) => d.msg).join(', ');
    }
    throw new Error(errorMsg);
  }

  setTokens(data.access_token, data.refresh_token, data.user);
  return data;
};

export const logoutUser = async () => {
  const refreshToken = getRefreshToken();
  if (refreshToken) {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    } catch (err) {
      console.warn('[API] Logout request error:', err);
    }
  }
  clearTokens();
};

export const getCurrentUser = async () => {
  const response = await authFetch('/api/auth/me', { method: 'GET' });
  if (!response.ok) {
    throw new Error('Failed to fetch user profile');
  }
  return response.json();
};

export const updateProfile = async ({ username, email }) => {
  const payload = {};
  if (username !== undefined) payload.username = username;
  if (email !== undefined) payload.email = email;

  const response = await authFetch('/api/auth/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    let errorMsg = 'Failed to update profile';
    if (typeof data.detail === 'string') errorMsg = data.detail;
    else if (Array.isArray(data.detail)) errorMsg = data.detail.map((d) => d.msg).join(', ');
    throw new Error(errorMsg);
  }

  // Update cached user in storage
  const storedUser = getStoredUser() || {};
  setTokens(getAccessToken(), getRefreshToken(), { ...storedUser, ...data });
  return data;
};

export const changePassword = async (currentPassword, newPassword) => {
  const response = await authFetch('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    let errorMsg = 'Failed to change password';
    if (typeof data.detail === 'string') errorMsg = data.detail;
    else if (Array.isArray(data.detail)) errorMsg = data.detail.map((d) => d.msg).join(', ');
    throw new Error(errorMsg);
  }
  return data;
};

export const forgotPassword = async (email) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  const data = await response.json();
  if (!response.ok) {
    let errorMsg = 'Failed to process password reset request';
    if (typeof data.detail === 'string') errorMsg = data.detail;
    else if (Array.isArray(data.detail)) errorMsg = data.detail.map((d) => d.msg).join(', ');
    throw new Error(errorMsg);
  }
  return data;
};

export const resetPassword = async (token, newPassword) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, new_password: newPassword }),
  });

  const data = await response.json();
  if (!response.ok) {
    let errorMsg = 'Password reset failed';
    if (typeof data.detail === 'string') errorMsg = data.detail;
    else if (Array.isArray(data.detail)) errorMsg = data.detail.map((d) => d.msg).join(', ');
    throw new Error(errorMsg);
  }
  return data;
};

export const deleteAccount = async (password) => {
  const response = await authFetch('/api/auth/me', {
    method: 'DELETE',
    body: JSON.stringify({ password }),
  });

  const data = await response.json();
  if (!response.ok) {
    let errorMsg = 'Failed to delete account';
    if (typeof data.detail === 'string') errorMsg = data.detail;
    else if (Array.isArray(data.detail)) errorMsg = data.detail.map((d) => d.msg).join(', ');
    throw new Error(errorMsg);
  }
  clearTokens();
  return data;
};

export const getHealth = async () => {
  const response = await fetch(`${API_BASE_URL}/api/health`, { method: 'GET' });
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.status}`);
  }
  return response.json();
};

// ==========================================
// TELEMETRY & POSTURE API
// ==========================================

export const getPostureStatus = async () => {
  const response = await authFetch('/api/posture', { method: 'GET' });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const getDetectionMode = async () => {
  const response = await authFetch('/api/detection-mode', { method: 'GET' });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const setDetectionMode = async (mode) => {
  const response = await authFetch('/api/set-mode', {
    method: 'POST',
    body: JSON.stringify({ mode }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || data.message || `HTTP error! status: ${response.status}`);
  }
  return data;
};

/**
 * Process a single webcam frame via FastAPI HTTP frame processor endpoint.
 * Supports Blob (multipart upload) or base64 data string.
 */
export const processFrame = async (blobOrBase64) => {
  let response;
  if (blobOrBase64 instanceof Blob) {
    const formData = new FormData();
    formData.append('file', blobOrBase64, 'frame.jpg');
    const token = getAccessToken();
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    response = await fetch(`${API_BASE_URL}/api/posture/process-frame`, {
      method: 'POST',
      headers,
      body: formData,
    });
  } else {
    response = await authFetch('/api/posture/process-frame', {
      method: 'POST',
      body: JSON.stringify({ image: blobOrBase64 }),
    });
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || `Frame processing failed: ${response.status}`);
  }
  return data;
};

/**
 * Generates the clean WebSocket URL for live posture telemetry streaming.
 * Authentication is performed in-band after connection to prevent URL token leakage.
 */
export const getPostureWebSocketUrl = () => {
  const wsBase = API_BASE_URL.replace(/^http/, 'ws');
  return `${wsBase}/api/posture/ws`;
};



// ==========================================
// ANALYTICS API
// ==========================================

export const getAnalytics = async () => {
  const response = await authFetch('/api/analytics', { method: 'GET' });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const resetAnalytics = async () => {
  const response = await authFetch('/api/analytics/reset', { method: 'POST' });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// ==========================================
// SESSIONS API
// ==========================================

export const startSession = async () => {
  const response = await authFetch('/api/session/start', { method: 'POST' });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const endSession = async () => {
  const response = await authFetch('/api/session/end', { method: 'POST' });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// ==========================================
// HISTORY & EXPORT API
// ==========================================

export const getHistory = async (arg1, arg2) => {
  // Support both getHistory(limit) and legacy getHistory(userId, limit)
  let limit = 100;
  if (typeof arg1 === 'number') {
    limit = arg1;
  } else if (typeof arg2 === 'number') {
    limit = arg2;
  }

  const response = await authFetch(`/api/history?limit=${limit}`, { method: 'GET' });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const clearHistory = async () => {
  const response = await authFetch('/api/history/clear', { method: 'POST' });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const getHistoryExportUrl = () => {
  return `${API_BASE_URL}/api/history/export`;
};

export const exportHistoryCSV = async () => {
  const response = await authFetch('/api/history/export', { method: 'GET' });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.text();
};

export const saveUserDetailsCSV = async () => {
  const response = await authFetch('/api/history/save-csv', { method: 'POST' });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// ==========================================
// AI RECOMMENDATIONS API
// ==========================================

export const getLLMAdvice = async () => {
  const response = await authFetch('/api/llm-advice', { method: 'GET' });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};
