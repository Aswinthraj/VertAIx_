import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ScanEye, Home, LayoutDashboard, ArrowLeft } from 'lucide-react';
import './NotFound.css';

const NotFound = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="notfound-page">
      <div className="notfound-card">
        <div className="notfound-icon-wrap">
          <ScanEye size={36} />
        </div>
        <span className="notfound-code">404</span>
        <h1 className="notfound-title">Page Not Found</h1>
        <p className="notfound-message">
          The requested path could not be located in the VertAIx system.
        </p>
        <div className="notfound-actions">
          {isAuthenticated ? (
            <Link to="/dashboard" className="notfound-btn primary">
              <LayoutDashboard size={16} />
              <span>Back to Dashboard</span>
            </Link>
          ) : (
            <Link to="/" className="notfound-btn primary">
              <Home size={16} />
              <span>Go to Home</span>
            </Link>
          )}
          <button onClick={() => window.history.back()} className="notfound-btn secondary">
            <ArrowLeft size={16} />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
