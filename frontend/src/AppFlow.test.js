import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }) => <div>{children}</div>,
  Routes: ({ children }) => <div>{children}</div>,
  Route: ({ element }) => <div>{element}</div>,
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
  useLocation: () => ({ pathname: '/', search: '' }),
  useNavigate: () => jest.fn(),
  useSearchParams: () => [new URLSearchParams(''), jest.fn()],
  Navigate: ({ to }) => <div data-testid="navigate">Redirecting to {to}</div>,
}));

// Mock AuthContext
jest.mock('./context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    loading: false,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    refreshUserProfile: jest.fn(),
  }),
  AuthProvider: ({ children }) => <div>{children}</div>,
}));

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Help from './pages/Help';
import NotFound from './pages/NotFound';

describe('VertAIx Frontend Page Suite', () => {
  test('Landing page renders hero heading and call-to-action buttons', () => {
    render(<Landing />);
    expect(screen.getByText(/Precision Ergonomic Posture Telemetry/i)).toBeInTheDocument();
    expect(screen.getByText(/Get Started/i)).toBeInTheDocument();
    const signInElements = screen.getAllByText(/Sign In/i);
    expect(signInElements.length).toBeGreaterThan(0);
  });

  test('Login page renders credentials form and forgot password link', () => {
    render(<Login />);
    expect(screen.getByLabelText(/Email or Username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByText(/Forgot Password\?/i)).toBeInTheDocument();
  });

  test('Register page renders required inputs and registration button', () => {
    render(<Register />);
    expect(screen.getByLabelText(/Username \/ Display Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByText(/Create Profile/i)).toBeInTheDocument();
  });

  test('ForgotPassword page renders email field and dispatch button', () => {
    render(<ForgotPassword />);
    expect(screen.getByLabelText(/Account Email Address/i)).toBeInTheDocument();
    expect(screen.getByText(/Send Reset Instructions/i)).toBeInTheDocument();
  });

  test('ResetPassword renders invalid link warning when no token is present', () => {
    render(<ResetPassword />);
    expect(screen.getByText(/Invalid Reset Link/i)).toBeInTheDocument();
  });

  test('Privacy Policy renders genuine data handling sections', () => {
    render(<Privacy />);
    expect(screen.getByText(/Privacy Policy/i)).toBeInTheDocument();
    expect(screen.getByText(/1\. Camera Stream & Computer-Vision Processing/i)).toBeInTheDocument();
  });

  test('Terms of Service renders medical disclaimer', () => {
    render(<Terms />);
    expect(screen.getByText(/Terms of Service/i)).toBeInTheDocument();
    expect(screen.getByText(/Important Medical Disclaimer:/i)).toBeInTheDocument();
  });

  test('Help guide renders camera positioning recommendations', () => {
    render(<Help />);
    expect(screen.getByText(/VertAIx Setup & Monitoring Guide/i)).toBeInTheDocument();
    expect(screen.getByText(/1\. Camera Setup & Positioning/i)).toBeInTheDocument();
  });

  test('NotFound page renders 404 notice and navigation action', () => {
    render(<NotFound />);
    expect(screen.getByText(/404/i)).toBeInTheDocument();
    expect(screen.getByText(/Page Not Found/i)).toBeInTheDocument();
    expect(screen.getByText(/Go to Home/i)).toBeInTheDocument();
  });
});
