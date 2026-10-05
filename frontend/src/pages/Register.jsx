import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, User, Mail, Lock, ScanEye, AlertOctagon, Loader2 } from 'lucide-react';
import './Login.css';

const Register = () => {
  const [searchParams] = useSearchParams();
  const nextPath = searchParams.get('next') || '/dashboard';

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const result = await register(username.trim(), email.trim(), password, nextPath);
    if (!result.success) {
      setError(result.error || 'Registration failed.');
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
          <h1 className="auth-title">Register Account</h1>
          <p className="auth-subtitle">Create a VertAIx profile for posture monitoring &amp; analytics</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && (
            <div className="auth-error-banner">
              <AlertOctagon size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-field-group">
            <label htmlFor="reg-username">
              <User size={14} />
              <span>Username / Display Name</span>
            </label>
            <input
              type="text"
              id="reg-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. jdoe_research"
              required
              autoComplete="username"
            />
          </div>

          <div className="form-field-group">
            <label htmlFor="reg-email">
              <Mail size={14} />
              <span>Email Address</span>
            </label>
            <input
              type="email"
              id="reg-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@domain.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-field-group">
            <label htmlFor="reg-password">
              <Lock size={14} />
              <span>Password (min. 8 characters)</span>
            </label>
            <input
              type="password"
              id="reg-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="new-password"
            />
          </div>

          <div className="form-field-group">
            <label htmlFor="reg-confirm-password">
              <Lock size={14} />
              <span>Confirm Password</span>
            </label>
            <input
              type="password"
              id="reg-confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              required
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading || !username || !email || !password || !confirmPassword}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Creating Profile...</span>
              </>
            ) : (
              <>
                <UserPlus size={16} />
                <span>Create Profile</span>
              </>
            )}
          </button>
        </form>

        <div className="auth-card-footer">
          <p>
            Already registered? <Link to={`/login?next=${encodeURIComponent(nextPath)}`} className="auth-switch-link">Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
