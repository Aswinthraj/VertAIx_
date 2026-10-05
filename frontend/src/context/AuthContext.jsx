import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  loginUser,
  registerUser,
  logoutUser,
  getCurrentUser,
  getAccessToken,
  getStoredUser,
  clearTokens,
} from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleUnauthorized = useCallback(() => {
    setUser(null);
    clearTokens();
    navigate('/login');
  }, [navigate]);

  useEffect(() => {
    // Listen for global 401 unrecoverable auth events
    window.addEventListener('vertaix:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('vertaix:unauthorized', handleUnauthorized);
    };
  }, [handleUnauthorized]);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = getAccessToken();
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const userData = await getCurrentUser();
        // Normalize user shape for React components
        const normalizedUser = {
          ...userData,
          uid: String(userData.id),
          displayName: userData.username,
        };
        setUser(normalizedUser);
      } catch (err) {
        console.warn('[VertAIx] Session initialization failed:', err);
        setUser(null);
        clearTokens();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const refreshUserProfile = async () => {
    try {
      const userData = await getCurrentUser();
      const normalizedUser = {
        ...userData,
        uid: String(userData.id),
        displayName: userData.username,
      };
      setUser(normalizedUser);
      return normalizedUser;
    } catch (err) {
      console.warn('[VertAIx] Failed to refresh profile:', err);
      return null;
    }
  };

  const login = async (usernameOrEmail, password, redirectPath = '/dashboard') => {
    try {
      const response = await loginUser(usernameOrEmail, password);
      const normalizedUser = {
        ...response.user,
        uid: String(response.user.id),
        displayName: response.user.username,
      };
      setUser(normalizedUser);
      toast.success('Signed in successfully!');
      navigate(redirectPath);
      return { success: true, user: normalizedUser };
    } catch (error) {
      const errorMessage = error.message || 'Login failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const register = async (username, email, password, redirectPath = '/dashboard') => {
    try {
      const response = await registerUser(username, email, password);
      const normalizedUser = {
        ...response.user,
        uid: String(response.user.id),
        displayName: response.user.username,
      };
      setUser(normalizedUser);
      toast.success('Account created successfully!');
      navigate(redirectPath);
      return { success: true, user: normalizedUser };
    } catch (error) {
      const errorMessage = error.message || 'Registration failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.warn('[VertAIx] Logout error:', err);
    } finally {
      setUser(null);
      clearTokens();
      navigate('/login');
      toast.info('Signed out of session');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        refreshUserProfile,
        loading,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
