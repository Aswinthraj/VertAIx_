const API_BASE_URL = 'http://127.0.0.1:5000';

/**
 * Fetch posture data from the backend API
 * @param {string} userId - Firebase user ID to send in request header
 * @returns {Promise} Response containing status, pcs, alert, sedentary_time, recommendations, and last_updated
 */
export const getPostureStatus = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/posture`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-USER-ID': userId
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching posture data:', error);
    throw error;
  }
};

/**
 * Fetch analytics data from the backend API
 * @param {string} userId - Firebase user ID to send in request header
 * @returns {Promise} Response containing analytics data
 */
export const getAnalytics = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/analytics`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-USER-ID': userId
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    throw error;
  }
};

/**
 * Reset analytics data for a user
 * @param {string} userId - Firebase user ID to send in request header
 * @returns {Promise} Response containing reset status
 */
export const resetAnalytics = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/analytics/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-USER-ID': userId
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error resetting analytics:', error);
    throw error;
  }
};

/**
 * Fetch history data from the backend API
 * @param {string} userId - Firebase user ID to send in request header
 * @param {number} limit - Maximum number of history entries to fetch (default 100)
 * @returns {Promise} Response containing history data and stats
 */
export const getHistory = async (userId, limit = 100) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/history?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-USER-ID': userId
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching history data:', error);
    throw error;
  }
};

/**
 * Fetch fresh LLM-generated advice from backend
 * @param {string} userId - Firebase user ID to send in request header
 * @returns {Promise} Response containing LLM advice and summary data
 */
export const getLLMAdvice = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/llm-advice`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-USER-ID': userId
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching LLM advice:', error);
    throw error;
  }
};

/**
 * Clear history for a user
 * @param {string} userId - Firebase user ID to send in request header
 * @returns {Promise} Response containing clear status
 */
export const clearHistory = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/history/clear`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-USER-ID': userId
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error clearing history:', error);
    throw error;
  }
};

/**
 * Get CSV export URL for history
 * @param {string} userId - Firebase user ID
 * @returns {string} URL to download CSV
 */
export const getHistoryExportUrl = (userId) => {
  return `${API_BASE_URL}/api/history/export?user_id=${userId}`;
};
