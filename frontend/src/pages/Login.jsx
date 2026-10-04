import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Mail, Lock, ScanEye } from 'lucide-react';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await login(email, password);
    setLoading(false);
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo-badge">
            <ScanEye size={24} />
          </div>
          <h1 className="auth-title">VertAIx Console</h1>
          <p className="auth-subtitle">Sign in to access real-time posture telemetry & analytics</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-field-group">
            <label htmlFor="email">
              <Mail size={14} />
              <span>Email or Username</span>
            </label>
            <input
              type="text"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="username or user@domain.com"
              required
              autoComplete="username"
            />
          </div>

          <div className="form-field-group">
            <label htmlFor="password">
              <Lock size={14} />
              <span>Password</span>
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading}
          >
            <LogIn size={16} />
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
          </button>
        </form>

        <div className="auth-card-footer">
          <p>
            Need an account? <Link to="/register" className="auth-switch-link">Register researcher profile</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
