import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock react-router-dom for Jest environment compatibility with React Router v7
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }) => <div data-testid="router">{children}</div>,
  Routes: ({ children }) => <div data-testid="routes">{children}</div>,
  Route: ({ element }) => <div data-testid="route">{element}</div>,
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
  useLocation: () => ({ pathname: '/' }),
  useNavigate: () => jest.fn(),
  Navigate: ({ to }) => <div data-testid="navigate" data-to={to}>Redirecting to {to}</div>,
}));

// Mock API service
jest.mock('./services/api', () => ({
  getAccessToken: jest.fn(() => 'mock-access-token'),
  getStoredUser: jest.fn(() => ({
    id: 1,
    username: 'researcher1',
    email: 'researcher1@example.com',
  })),
  getCurrentUser: jest.fn(() =>
    Promise.resolve({
      id: 1,
      username: 'researcher1',
      email: 'researcher1@example.com',
    })
  ),
  loginUser: jest.fn(),
  registerUser: jest.fn(),
  logoutUser: jest.fn(),
  clearTokens: jest.fn(),
  setTokens: jest.fn(),
}));

import App from './App';

test('renders VertAIx brand navigation and application layout', () => {
  render(<App />);
  const brandElements = screen.getAllByText(/VertAIx/i);
  expect(brandElements.length).toBeGreaterThan(0);
});
