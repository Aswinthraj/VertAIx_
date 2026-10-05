import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../services/api';
import { Lock, ScanEye, CheckCircle2, AlertOctagon, ArrowLeft, RotateCcw, Loader2 } from 'lucide-react';
import './Login.css';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Password reset token is missing from the URL.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'This password-reset link is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo-badge">
            <ScanEye size={24} />
          </div>
          <h1 className="auth-title">Set New Password</h1>
          <p className="auth-subtitle">
            Create a secure new password for your VertAIx workspace account
          </p>
        </div>

        {!token ? (
          <div className="auth-error-state">
            <div className="auth-error-icon-wrap">
              <AlertOctagon size={36} className="text-bad" />
            </div>
            <h2 className="auth-error-title">Invalid Reset Link</h2>
            <p className="auth-error-message">
              This password-reset link is invalid or has expired. Please request a new link to reset your password.
            </p>
            <div className="auth-card-footer">
              <Link to="/forgot-password" className="auth-submit-btn">
                <RotateCcw size={16} />
                <span>Request New Reset Link</span>
              </Link>
            </div>
          </div>
        ) : success ? (
          <div className="auth-success-state">
            <div className="auth-success-icon-wrap">
              <CheckCircle2 size={36} className="text-good" />
            </div>
            <h2 className="auth-success-title">Password Updated</h2>
            <p className="auth-success-message">
              Your password has been successfully updated. All prior sessions have been invalidated for security.
            </p>
            <div className="auth-card-footer">
              <Link to="/login" className="auth-submit-btn">
                <ArrowLeft size={16} />
                <span>Sign In With New Password</span>
              </Link>
            </div>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            {error && (
              <div className="auth-error-banner">
                <AlertOctagon size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-field-group">
              <label htmlFor="new-password">
                <Lock size={14} />
                <span>New Password</span>
              </label>
              <input
                type="password"
                id="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                required
                autoComplete="new-password"
              />
            </div>

            <div className="form-field-group">
              <label htmlFor="confirm-new-password">
                <Lock size={14} />
                <span>Confirm New Password</span>
              </label>
              <input
                type="password"
                id="confirm-new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                required
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading || !password || !confirmPassword}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <span>Update Password</span>
              )}
            </button>

            <div className="auth-card-footer">
              <Link to="/forgot-password" className="auth-switch-link inline-flex">
                <RotateCcw size={14} />
                <span>Request a new reset link</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
