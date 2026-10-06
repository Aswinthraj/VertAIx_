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
  processFrame,
  getPostureWebSocketUrl,
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

  test('profile, password, reset, and deletion endpoints execute correct requests', async () => {
    setTokens('access-token', 'refresh-token');
    const mockFetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, message: 'Operation successful' }),
      })
    );
    global.fetch = mockFetch;

    const {
      updateProfile,
      changePassword,
      forgotPassword,
      resetPassword,
      deleteAccount,
      getHealth,
    } = require('./api');

    await updateProfile({ username: 'newname', email: 'new@example.com' });
    expect(mockFetch).toHaveBeenLastCalledWith(
      expect.stringContaining('/api/auth/me'),
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ username: 'newname', email: 'new@example.com' }),
      })
    );

    await changePassword('oldpass123', 'newpass123');
    expect(mockFetch).toHaveBeenLastCalledWith(
      expect.stringContaining('/api/auth/change-password'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ current_password: 'oldpass123', new_password: 'newpass123' }),
      })
    );

    await forgotPassword('user@example.com');
    expect(mockFetch).toHaveBeenLastCalledWith(
      expect.stringContaining('/api/auth/forgot-password'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'user@example.com' }),
      })
    );

    await resetPassword('reset-tok-123', 'newpass456');
    expect(mockFetch).toHaveBeenLastCalledWith(
      expect.stringContaining('/api/auth/reset-password'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ token: 'reset-tok-123', new_password: 'newpass456' }),
      })
    );

    await deleteAccount('confirm-pass');
    expect(mockFetch).toHaveBeenLastCalledWith(
      expect.stringContaining('/api/auth/me'),
      expect.objectContaining({
        method: 'DELETE',
        body: JSON.stringify({ password: 'confirm-pass' }),
      })
    );
    expect(getAccessToken()).toBeNull();

    await getHealth();
    expect(mockFetch).toHaveBeenLastCalledWith(
      expect.stringContaining('/api/health'),
      expect.objectContaining({ method: 'GET' })
    );
  });

  test('processFrame sends frame payload and returns parsed telemetry', async () => {
    setTokens('token-xyz', 'refresh-xyz');
    const mockResult = {
      status: 'Good Posture',
      pcs: 92.0,
      alert: false,
      neck_angle: 5.2,
      shoulder_angle: 1.1,
      spine_angle: 3.8,
      landmarks_detected: true,
    };
    const mockFetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResult),
      })
    );
    global.fetch = mockFetch;

    const result = await processFrame('data:image/jpeg;base64,samplebase64frame');
    expect(result.status).toBe('Good Posture');
    expect(result.pcs).toBe(92.0);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/posture/process-frame'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ image: 'data:image/jpeg;base64,samplebase64frame' }),
      })
    );
  });

  test('getPostureWebSocketUrl formats ws protocol and includes token param', () => {
    setTokens('sample-jwt-token', 'refresh-token');
    const wsUrl = getPostureWebSocketUrl();
    expect(wsUrl).toContain('ws://');
    expect(wsUrl).toContain('/api/posture/ws?token=sample-jwt-token');
  });
});

