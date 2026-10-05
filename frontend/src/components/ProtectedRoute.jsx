import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '80vh',
        gap: '1rem',
        color: '#00D4B8'
      }}>
        <Loader2 className="animate-spin" size={36} style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ color: '#64748b', fontSize: '0.875rem', letterSpacing: '0.05em' }}>
          VERIFYING SESSION...
        </span>
      </div>
    );
  }

  if (!isAuthenticated) {
    const nextPath = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${nextPath}`} replace />;
  }

  return children;
};

export default ProtectedRoute;
