import {
  setTokens,
  getAccessToken,
  getRefreshToken,
  clearTokens,
  getStoredUser,
  authFetch,
  loginUser,
  registerUser,
  logoutUser,
  getPostureStatus,
  getAnalytics,
  resetAnalytics,
  startSession,
  endSession,
  getHistory,
  clearHistory,
  setDetectionMode,
  getDetectionMode,
  getLLMAdvice,
} from './api';

describe('API Service & JWT Lifecycle', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('token storage functions set, retrieve, and clear tokens', () => {
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(getStoredUser()).toBeNull();

    const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' };
    setTokens('access-123', 'refresh-456', mockUser);

    expect(getAccessToken()).toBe('access-123');
    expect(getRefreshToken()).toBe('refresh-456');
    expect(getStoredUser()).toEqual(mockUser);

    clearTokens();
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(getStoredUser()).toBeNull();
  });

  test('authFetch attaches Authorization header when access token is present', async () => {
    setTokens('valid-access-token', 'valid-refresh-token');

    const mockFetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ status: 'ok' }),
      })
    );
    global.fetch = mockFetch;

    await authFetch('/api/posture');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/posture'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer valid-access-token',
        }),
      })
    );
  });

  test('authFetch automatically refreshes token on 401 and retries request', async () => {
    setTokens('expired-access-token', 'valid-refresh-token');

    const mockFetch = jest
      .fn()
      // First call fails with 401
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
      })
      // Refresh call succeeds with 200
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            access_token: 'fresh-access-token',
            refresh_token: 'fresh-refresh-token',
            user: { id: 1, username: 'refreshed_user' },
          }),
      })
      // Retried call succeeds with 200
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'success_data' }),
      });

    global.fetch = mockFetch;

    const response = await authFetch('/api/analytics');
    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(getAccessToken()).toBe('fresh-access-token');
    expect(getRefreshToken()).toBe('fresh-refresh-token');
  });

  test('endpoint helpers execute correct HTTP methods and paths', async () => {
    setTokens('access-token', 'refresh-token');
    const mockFetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ status: 'success' }),
      })
    );
    global.fetch = mockFetch;

    await getPostureStatus();
    expect(mockFetch).toHaveBeenLastCalledWith(
      expect.stringContaining('/api/posture'),
      expect.objectContaining({ method: 'GET' })
    );

    await getAnalytics();
    expect(mockFetch).toHaveBeenLastCalledWith(
      expect.stringContaining('/api/analytics'),
      expect.objectContaining({ method: 'GET' })
    );

    await resetAnalytics();
    expect(mockFetch).toHaveBeenLastCalledWith(
      expect.stringContaining('/api/analytics/reset'),
      expect.objectContaining({ method: 'POST' })
    );

    await startSession();
    expect(mockFetch).toHaveBeenLastCalledWith(
      expect.stringContaining('/api/session/start'),
      expect.objectContaining({ method: 'POST' })
    );

    await endSession();
    expect(mockFetch).toHaveBeenLastCalledWith(
      expect.stringContaining('/api/session/end'),
      expect.objectContaining({ method: 'POST' })
    );

    await getHistory(50);
    expect(mockFetch).toHaveBeenLastCalledWith(
      expect.stringContaining('/api/history?limit=50'),
      expect.objectContaining({ method: 'GET' })
    );

    await clearHistory();
    expect(mockFetch).toHaveBeenLastCalledWith(
      expect.stringContaining('/api/history/clear'),
      expect.objectContaining({ method: 'POST' })
    );

    await setDetectionMode('ml');
    expect(mockFetch).toHaveBeenLastCalledWith(
      expect.stringContaining('/api/set-mode'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ mode: 'ml' }) })
    );

    await getDetectionMode();
    expect(mockFetch).toHaveBeenLastCalledWith(
      expect.stringContaining('/api/detection-mode'),
      expect.objectContaining({ method: 'GET' })
    );

    await getLLMAdvice();
    expect(mockFetch).toHaveBeenLastCalledWith(
      expect.stringContaining('/api/llm-advice'),
      expect.objectContaining({ method: 'GET' })
    );
  });
});
