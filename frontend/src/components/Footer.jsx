import React from 'react';
import { Link } from 'react-router-dom';
import { ScanEye, ShieldCheck, Activity, HelpCircle, Info, FileText } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="vertaix-footer">
      <div className="footer-container">
        <div className="footer-main-grid">
          {/* Brand Info */}
          <div className="footer-brand-col">
            <Link to="/" className="footer-logo">
              <div className="footer-logo-badge">
                <ScanEye size={18} />
              </div>
              <div className="footer-logo-text">
                <span className="footer-brand-name">VertAIx</span>
                <span className="footer-brand-tag">CV Posture Monitoring</span>
              </div>
            </Link>
            <p className="footer-tagline">
              Vision-based ergonomic posture monitoring, landmark estimation, and continuous Posture Confidence Scoring (PCS).
            </p>
            <div className="footer-status-pill">
              <span className="status-indicator-dot" />
              <span>Edge Landmark Telemetry Engine</span>
            </div>
          </div>

          {/* Navigation Columns */}
          <div className="footer-nav-col">
            <h4 className="footer-heading">Workspace</h4>
            <ul className="footer-links">
              <li>
                <Link to="/dashboard" className="footer-link">
                  <Activity size={14} />
                  <span>Monitoring Console</span>
                </Link>
              </li>
              <li>
                <Link to="/analytics" className="footer-link">
                  <Activity size={14} />
                  <span>Posture Analytics</span>
                </Link>
              </li>
              <li>
                <Link to="/history" className="footer-link">
                  <Activity size={14} />
                  <span>Session History</span>
                </Link>
              </li>
              <li>
                <Link to="/settings" className="footer-link">
                  <Activity size={14} />
                  <span>Account & Settings</span>
                </Link>
              </li>
            </ul>
          </div>

          <div className="footer-nav-col">
            <h4 className="footer-heading">Documentation</h4>
            <ul className="footer-links">
              <li>
                <Link to="/about" className="footer-link">
                  <Info size={14} />
                  <span>About System</span>
                </Link>
              </li>
              <li>
                <Link to="/help" className="footer-link">
                  <HelpCircle size={14} />
                  <span>Camera & Setup Guide</span>
                </Link>
              </li>
              <li>
                <a href="/api/docs" target="_blank" rel="noopener noreferrer" className="footer-link">
                  <FileText size={14} />
                  <span>API Documentation</span>
                </a>
              </li>
            </ul>
          </div>

          <div className="footer-nav-col">
            <h4 className="footer-heading">Compliance</h4>
            <ul className="footer-links">
              <li>
                <Link to="/privacy" className="footer-link">
                  <ShieldCheck size={14} />
                  <span>Privacy Policy</span>
                </Link>
              </li>
              <li>
                <Link to="/terms" className="footer-link">
                  <FileText size={14} />
                  <span>Terms of Service</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer and Copyright */}
        <div className="footer-bottom-bar">
          <p className="footer-disclaimer">
            <strong>Notice:</strong> VertAIx is a computer-vision ergonomic monitoring and research tool. It does not provide medical diagnosis, treatment, or clinical health advice.
          </p>
          <div className="footer-copyright">
            <span>&copy; {currentYear} VertAIx Posture Analytics. All rights reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
