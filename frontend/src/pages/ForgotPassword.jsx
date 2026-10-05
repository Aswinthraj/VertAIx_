import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../services/api';
import { Mail, ArrowLeft, ScanEye, CheckCircle2, AlertOctagon, Loader2 } from 'lucide-react';
import './Login.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await forgotPassword(email.trim());
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Unable to process reset request. Please try again.');
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
          <h1 className="auth-title">Reset Password</h1>
          <p className="auth-subtitle">
            Enter your account email to receive secure recovery instructions
          </p>
        </div>

        {submitted ? (
          <div className="auth-success-state">
            <div className="auth-success-icon-wrap">
              <CheckCircle2 size={36} className="text-good" />
            </div>
            <h2 className="auth-success-title">Recovery Email Dispatched</h2>
            <p className="auth-success-message">
              If an account exists for <strong>{email}</strong>, a secure password-reset link has been sent to that address.
            </p>
            <p className="auth-privacy-note">
              For security, the link is single-use and will expire in 15 minutes.
            </p>
            <div className="auth-card-footer">
              <Link to="/login" className="auth-submit-btn secondary">
                <ArrowLeft size={16} />
                <span>Return to Sign In</span>
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
              <label htmlFor="reset-email">
                <Mail size={14} />
                <span>Account Email Address</span>
              </label>
              <input
                type="email"
                id="reset-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@organization.com"
                required
                autoComplete="email"
              />
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading || !email}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Processing Request...</span>
                </>
              ) : (
                <span>Send Reset Instructions</span>
              )}
            </button>

            <div className="auth-card-footer">
              <Link to="/login" className="auth-switch-link inline-flex">
                <ArrowLeft size={14} />
                <span>Back to Sign In</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
