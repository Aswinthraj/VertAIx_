import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Mail, Lock, ScanEye, AlertOctagon, Loader2 } from 'lucide-react';
import './Login.css';

const Login = () => {
  const [searchParams] = useSearchParams();
  const nextPath = searchParams.get('next') || '/dashboard';

  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(usernameOrEmail.trim(), password, nextPath);
    if (!result.success) {
      setError(result.error || 'Invalid credentials or connection error');
    }
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
          <p className="auth-subtitle">Sign in to access real-time posture telemetry &amp; analytics</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && (
            <div className="auth-error-banner">
              <AlertOctagon size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-field-group">
            <label htmlFor="login-identity">
              <Mail size={14} />
              <span>Email or Username</span>
            </label>
            <input
              type="text"
              id="login-identity"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              placeholder="username or user@domain.com"
              required
              autoComplete="username"
            />
          </div>

          <div className="form-field-group">
            <div className="label-with-action">
              <label htmlFor="login-password">
                <Lock size={14} />
                <span>Password</span>
              </label>
              <Link to="/forgot-password" className="forgot-password-link">
                Forgot Password?
              </Link>
            </div>
            <input
              type="password"
              id="login-password"
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
            disabled={loading || !usernameOrEmail || !password}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <LogIn size={16} />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        <div className="auth-card-footer">
          <p>
            Need an account? <Link to={`/register?next=${encodeURIComponent(nextPath)}`} className="auth-switch-link">Create workspace profile</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
