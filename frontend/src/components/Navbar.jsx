import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  BarChart3,
  History as HistoryIcon,
  Settings as SettingsIcon,
  Info,
  LogOut,
  LogIn,
  UserPlus,
  Menu,
  X,
  ScanEye
} from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* Brand Logo */}
        <Link to="/" className="navbar-logo" onClick={closeMobileMenu}>
          <div className="logo-badge">
            <ScanEye className="logo-icon-svg" size={20} />
          </div>
          <div className="logo-text-group">
            <span className="logo-title">VertAIx</span>
            <span className="logo-tag">CV Posture Lab</span>
          </div>
        </Link>

        {/* Mobile Menu Toggle Button */}
        <button
          className="mobile-toggle-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* Desktop Navigation Links */}
        <nav className={`nav-menu-wrapper ${mobileMenuOpen ? 'open' : ''}`}>
          <ul className="nav-menu">
            <li className="nav-item">
              <Link to="/" className={`nav-link ${isActive('/')}`} onClick={closeMobileMenu}>
                <LayoutDashboard size={17} className="nav-icon" />
                <span>Dashboard</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/analytics" className={`nav-link ${isActive('/analytics')}`} onClick={closeMobileMenu}>
                <BarChart3 size={17} className="nav-icon" />
                <span>Analytics</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/history" className={`nav-link ${isActive('/history')}`} onClick={closeMobileMenu}>
                <HistoryIcon size={17} className="nav-icon" />
                <span>History</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/settings" className={`nav-link ${isActive('/settings')}`} onClick={closeMobileMenu}>
                <SettingsIcon size={17} className="nav-icon" />
                <span>Settings</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/about" className={`nav-link ${isActive('/about')}`} onClick={closeMobileMenu}>
                <Info size={17} className="nav-icon" />
                <span>About</span>
              </Link>
            </li>
          </ul>

          {/* Auth Actions */}
          <div className="navbar-auth">
            {isAuthenticated ? (
              <div className="user-profile-strip">
                <span className="user-label" title={user?.email || user?.displayName}>
                  {user?.displayName || user?.email?.split('@')[0] || 'Researcher'}
                </span>
                <button onClick={() => { closeMobileMenu(); logout(); }} className="logout-btn" title="Sign out">
                  <LogOut size={15} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="auth-btn-group">
                <Link to="/login" className="auth-link login" onClick={closeMobileMenu}>
                  <LogIn size={15} />
                  <span>Login</span>
                </Link>
                <Link to="/register" className="auth-link register" onClick={closeMobileMenu}>
                  <UserPlus size={15} />
                  <span>Register</span>
                </Link>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
