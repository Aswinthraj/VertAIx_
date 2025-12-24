import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';
import { PieChartOutlined, LogoutOutlined, BarChartOutlined, FieldTimeOutlined, SettingOutlined, InfoCircleOutlined, UserAddOutlined } from '@ant-design/icons';

const Navbar = () => {
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="logo-icon"></span>
          <span className="logo-text">VertAIx</span>
        </Link>
        
        <ul className="nav-menu">
          <li className="nav-item">
            <Link to="/" className={`nav-link ${isActive('/')}`}>
              <span className="nav-icon"><PieChartOutlined /></span>
              Dashboard
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/analytics" className={`nav-link ${isActive('/analytics')}`}>
              <span className="nav-icon"><BarChartOutlined /></span>
              Analytics
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/history" className={`nav-link ${isActive('/history')}`}>
              <span className="nav-icon"><FieldTimeOutlined /></span>
              History
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/settings" className={`nav-link ${isActive('/settings')}`}>
              <span className="nav-icon"><SettingOutlined /></span>
              Settings
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/about" className={`nav-link ${isActive('/about')}`}>
              <span className="nav-icon"><InfoCircleOutlined /></span>
              About
            </Link>
          </li>
        </ul>

        <div className="navbar-auth">
          {isAuthenticated ? (
            <>
              <span className="user-welcome">Hi, {user?.displayName || user?.email}</span>
              <button onClick={logout} className="logout-btn">
                Logout <span className="logout-icon"><LogoutOutlined /></span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="auth-link">Login</Link>
              <Link to="/register" className="auth-link register">Register <UserAddOutlined /></Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
