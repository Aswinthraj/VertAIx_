import React from 'react';
import { Link } from 'react-router-dom';
import {
  HelpCircle,
  Camera,
  Activity,
  Cpu,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  ArrowRight
} from 'lucide-react';
import './Help.css';

const Help = () => {
  return (
    <div className="help-page">
      <div className="help-container">
        {/* Header */}
        <header className="help-header">
          <div className="help-badge-row">
            <span className="help-badge">
              <HelpCircle size={14} />
              <span>Usage &amp; Camera Guide</span>
            </span>
          </div>
          <h1 className="help-title">VertAIx Setup &amp; Monitoring Guide</h1>
          <p className="help-subtitle">
            Essential guidance for optimal camera placement, telemetry interpretation, and detection modes
          </p>
        </header>

        <div className="help-grid">
          {/* Guide 1: Camera Placement */}
          <div className="help-card">
            <div className="help-card-header">
              <div className="help-icon-badge">
                <Camera size={20} />
              </div>
              <h2 className="help-card-title">1. Camera Setup &amp; Positioning</h2>
            </div>
            <p className="help-card-intro">
              For reliable landmark detection via MediaPipe Pose, position your webcam according to these guidelines:
            </p>
            <ul className="help-checklist">
              <li>
                <CheckCircle2 size={16} className="chk-icon good" />
                <span><strong>Placement Angle:</strong> Mount the webcam directly in front of you at eye level, or angled slightly (15°–45° side-profile) to capture both ears and shoulders.</span>
              </li>
              <li>
                <CheckCircle2 size={16} className="chk-icon good" />
                <span><strong>Optimal Distance:</strong> Sit between <strong>0.8m to 1.5m (2.5 to 5 feet)</strong> from the lens.</span>
              </li>
              <li>
                <CheckCircle2 size={16} className="chk-icon good" />
                <span><strong>Adequate Lighting:</strong> Ensure front lighting without strong glare or backlighting behind your head.</span>
              </li>
              <li>
                <CheckCircle2 size={16} className="chk-icon good" />
                <span><strong>Upper Body Framing:</strong> Ensure your head, neck, shoulders, and upper chest remain unobstructed in the frame.</span>
              </li>
            </ul>
          </div>

          {/* Guide 2: Posture Score Interpretation */}
          <div className="help-card">
            <div className="help-card-header">
              <div className="help-icon-badge">
                <Activity size={20} />
              </div>
              <h2 className="help-card-title">2. Understanding Posture Ratings &amp; PCS</h2>
            </div>
            <p className="help-card-intro">
              VertAIx continuously calculates a 0–100 Posture Confidence Score (PCS) using a 30-frame rolling smoothing window:
            </p>
            <div className="status-tiers-grid">
              <div className="status-tier-box tier-good">
                <div className="tier-header">
                  <CheckCircle2 size={16} />
                  <strong>Good (&ge; 80% PCS)</strong>
                </div>
                <p>Ears aligned with shoulders, neutral neck inclination, and balanced shoulder elevation.</p>
              </div>

              <div className="status-tier-box tier-warning">
                <div className="tier-header">
                  <AlertTriangle size={16} />
                  <strong>Warning (50% – 79% PCS)</strong>
                </div>
                <p>Mild forward head posture or slight shoulder asymmetry detected.</p>
              </div>

              <div className="status-tier-box tier-bad">
                <div className="tier-header">
                  <AlertOctagon size={16} />
                  <strong>Bad (&lt; 50% PCS)</strong>
                </div>
                <p>Excessive forward neck inclination, severe slouching, or significant lateral tilt.</p>
              </div>
            </div>
          </div>

          {/* Guide 3: Detection Modes */}
          <div className="help-card">
            <div className="help-card-header">
              <div className="help-icon-badge">
                <Cpu size={20} />
              </div>
              <h2 className="help-card-title">3. Rule-Based vs ML Detection Modes</h2>
            </div>
            <p className="help-card-intro">
              You can toggle between two classification engines in the Dashboard:
            </p>
            <div className="modes-compare-grid">
              <div className="mode-box">
                <h3 className="mode-name">Rule-Based Mode (Default)</h3>
                <p className="mode-desc">
                  Uses deterministic geometric trigonometry to compute neck inclination and shoulder tilt against verified biomechanical ergonomic thresholds.
                </p>
              </div>
              <div className="mode-box">
                <h3 className="mode-name">ML-Based Mode</h3>
                <p className="mode-desc">
                  Uses a pre-trained Random Forest classifier trained on posture coordinate features to classify posture patterns probabilistically.
                </p>
              </div>
            </div>
          </div>

          {/* Guide 4: Sedentary Tracking & Telemetry History */}
          <div className="help-card">
            <div className="help-card-header">
              <div className="help-icon-badge">
                <Clock size={20} />
              </div>
              <h2 className="help-card-title">4. Sedentary Timers &amp; Data History</h2>
            </div>
            <p className="help-card-intro">
              The system tracks your cumulative session duration and alerts you during prolonged sitting bouts:
            </p>
            <ul className="help-checklist">
              <li>
                <CheckCircle2 size={16} className="chk-icon good" />
                <span><strong>Active Sessions:</strong> Start and stop monitoring sessions from the Dashboard at will.</span>
              </li>
              <li>
                <CheckCircle2 size={16} className="chk-icon good" />
                <span><strong>CSV Export:</strong> In the History tab, download your raw numerical telemetry logs for offline research analysis.</span>
              </li>
              <li>
                <CheckCircle2 size={16} className="chk-icon good" />
                <span><strong>Ergonomic Rest Breaks:</strong> Stand, stretch, and reset your baseline whenever sedentary warnings trigger.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Quick Links Banner */}
        <div className="help-footer-banner">
          <div className="help-banner-content">
            <h3>Ready to monitor your posture?</h3>
            <p>Access the live monitoring console to calibrate and begin tracking.</p>
          </div>
          <Link to="/dashboard" className="cta-btn primary">
            <span>Open Dashboard</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Help;
