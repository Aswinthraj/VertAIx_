import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, User, Mail, Lock, ScanEye, AlertOctagon } from 'lucide-react';
import './Login.css';

const Register = () => {
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

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    await register(username, email, password);
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
          <p className="auth-subtitle">Create a VertAIx workspace profile for posture monitoring</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && (
            <div className="auth-error-banner">
              <AlertOctagon size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-field-group">
            <label htmlFor="username">
              <User size={14} />
              <span>User / Display Name</span>
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. Researcher A"
              required
              autoComplete="username"
            />
          </div>

          <div className="form-field-group">
            <label htmlFor="email">
              <Mail size={14} />
              <span>Email Address</span>
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@domain.com"
              required
              autoComplete="email"
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
              placeholder="Min. 6 characters"
              required
              autoComplete="new-password"
            />
          </div>

          <div className="form-field-group">
            <label htmlFor="confirmPassword">
              <Lock size={14} />
              <span>Confirm Password</span>
            </label>
            <input
              type="password"
              id="confirmPassword"
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
            disabled={loading}
          >
            <UserPlus size={16} />
            <span>{loading ? 'Creating Profile...' : 'Register Profile'}</span>
          </button>
        </form>

        <div className="auth-card-footer">
          <p>
            Already registered? <Link to="/login" className="auth-switch-link">Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
