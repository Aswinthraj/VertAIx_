import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ScanEye,
  Camera,
  Activity,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  FileSpreadsheet,
  Cpu,
  Clock,
  HelpCircle
} from 'lucide-react';
import './Landing.css';

const Landing = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="landing-hero-section">
        <div className="landing-container hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-pulse" />
              <span>Computer-Vision Posture Monitoring</span>
            </div>
            
            <h1 className="hero-title">
              Precision Ergonomic Posture Telemetry <span className="highlight-text">Without Wearables</span>
            </h1>

            <p className="hero-description">
              VertAIx leverages continuous optical pose estimation to analyze sitting alignment, compute real-time Posture Confidence Scores (PCS), and deliver ergonomic alerts directly in your browser.
            </p>

            <div className="hero-cta-group">
              {isAuthenticated ? (
                <Link to="/dashboard" className="cta-btn primary">
                  <span>Open Monitoring Console</span>
                  <ArrowRight size={18} />
                </Link>
              ) : (
                <>
                  <Link to="/register" className="cta-btn primary">
                    <span>Get Started</span>
                    <ArrowRight size={18} />
                  </Link>
                  <Link to="/login" className="cta-btn secondary">
                    <span>Sign In</span>
                  </Link>
                </>
              )}
            </div>

            <div className="hero-specs-row">
              <div className="spec-item">
                <span className="spec-label">Pose Architecture</span>
                <strong className="spec-value">33 Landmark Estimation</strong>
              </div>
              <div className="spec-divider" />
              <div className="spec-item">
                <span className="spec-label">Detection Engines</span>
                <strong className="spec-value">Geometric &amp; ML Models</strong>
              </div>
              <div className="spec-divider" />
              <div className="spec-item">
                <span className="spec-label">Scoring Metric</span>
                <strong className="spec-value">Posture Confidence (PCS)</strong>
              </div>
            </div>
          </div>

          <div className="hero-preview-panel">
            <div className="preview-terminal">
              <div className="terminal-header">
                <div className="terminal-dots">
                  <span className="dot red" />
                  <span className="dot yellow" />
                  <span className="dot green" />
                </div>
                <div className="terminal-title">
                  <ScanEye size={14} />
                  <span>runtime.telemetry.active</span>
                </div>
                <span className="terminal-status-pill">MONITORING</span>
              </div>
              <div className="terminal-body">
                <div className="terminal-row">
                  <span className="t-label">CLASSIFICATION:</span>
                  <span className="t-val-good">GOOD POSTURE (92.4% PCS)</span>
                </div>
                <div className="terminal-row">
                  <span className="t-label">DETECTION ENGINE:</span>
                  <span className="t-val">RULE-BASED GEOMETRIC</span>
                </div>
                <div className="terminal-row">
                  <span className="t-label">NECK INCLINATION:</span>
                  <span className="t-val">12.8° (NORMAL ALIGNMENT)</span>
                </div>
                <div className="terminal-row">
                  <span className="t-label">SHOULDER TILT:</span>
                  <span className="t-val">2.1° (BALANCED)</span>
                </div>
                <div className="terminal-row">
                  <span className="t-label">SEDENTARY TIMER:</span>
                  <span className="t-val">24 min 18 sec</span>
                </div>
                <div className="terminal-row">
                  <span className="t-label">BUFFER SMOOTHING:</span>
                  <span className="t-val">30-Frame Rolling Average</span>
                </div>
                <div className="terminal-alert-box">
                  <CheckCircle2 size={16} className="t-icon-good" />
                  <span>Spinal alignment within recommended ergonomic thresholds.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="landing-section dark-bg">
        <div className="landing-container">
          <div className="section-header-center">
            <div className="section-eyebrow">
              <Layers size={16} />
              <span>HOW VERTAIX WORKS</span>
            </div>
            <h2 className="section-heading">Biomechanical Analysis Pipeline</h2>
            <p className="section-subtext">
              Real-time video processing designed to track upper-body ergonomic health without intrusive sensors.
            </p>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-icon-wrap">
                <Camera size={24} />
                <span className="step-number">01</span>
              </div>
              <h3 className="step-card-title">Video Stream Ingestion</h3>
              <p className="step-card-text">
                Webcam video frames are captured locally and passed directly to the worker thread for frame-by-frame anatomical analysis.
              </p>
            </div>

            <div className="step-card">
              <div className="step-icon-wrap">
                <ScanEye size={24} />
                <span className="step-number">02</span>
              </div>
              <h3 className="step-card-title">Landmark Coordinate Extraction</h3>
              <p className="step-card-text">
                MediaPipe Pose predicts 3D coordinates for facial and upper-body keypoints: nose, ears, shoulders, and hip anchors.
              </p>
            </div>

            <div className="step-card">
              <div className="step-icon-wrap">
                <Cpu size={24} />
                <span className="step-number">03</span>
              </div>
              <h3 className="step-card-title">Angular &amp; ML Classification</h3>
              <p className="step-card-text">
                Evaluates neck tilt, shoulder symmetry, and forward lean via geometric angular bounds or trained Random Forest classification.
              </p>
            </div>

            <div className="step-card">
              <div className="step-icon-wrap">
                <Activity size={24} />
                <span className="step-number">04</span>
              </div>
              <h3 className="step-card-title">Real-Time Scoring &amp; Guidance</h3>
              <p className="step-card-text">
                Calculates a smoothed Posture Confidence Score (PCS), tracks sedentary accumulation, and renders live alerts in the dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section className="landing-section">
        <div className="landing-container">
          <div className="section-header-center">
            <div className="section-eyebrow">
              <Sliders size={16} />
              <span>CORE CAPABILITIES</span>
            </div>
            <h2 className="section-heading">Built for Ergonomic Precision</h2>
            <p className="section-subtext">
              Comprehensive telemetry, historical tracking, and personalized coaching for desktop posture management.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-box">
                <Activity size={22} />
              </div>
              <h3 className="feature-title">Live Posture Scoring (PCS)</h3>
              <p className="feature-description">
                Continuous 0–100 score classifying posture state as <strong>Good</strong> (&ge;80%), <strong>Warning</strong> (50–79%), or <strong>Bad</strong> (&lt;50%).
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box">
                <Cpu size={22} />
              </div>
              <h3 className="feature-title">Dual Classification Modes</h3>
              <p className="feature-description">
                Switch seamlessly between Rule-Based geometric thresholds and a trained Random Forest ML model to compare classification behaviors.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box">
                <Clock size={22} />
              </div>
              <h3 className="feature-title">Sedentary Duration Tracking</h3>
              <p className="feature-description">
                Monitors active session time and consecutive sedentary minutes to alert you when periodic movement breaks are needed.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box">
                <FileSpreadsheet size={22} />
              </div>
              <h3 className="feature-title">Telemetry History &amp; CSV Export</h3>
              <p className="feature-description">
                Review historical posture logs, analyze aggregate time spent in each posture zone, and export data records for offline evaluation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy & Responsible Use Banner */}
      <section className="landing-section privacy-section">
        <div className="landing-container">
          <div className="privacy-card">
            <div className="privacy-icon-badge">
              <ShieldCheck size={32} />
            </div>
            <div className="privacy-text-group">
              <h3 className="privacy-title">Camera Processing &amp; Privacy By Design</h3>
              <p className="privacy-description">
                Video frames captured by your webcam are processed directly in memory for coordinate extraction and are never recorded, saved, or uploaded as video files. Only anonymized numerical telemetry and session metrics are stored.
              </p>
              <div className="privacy-links-row">
                <Link to="/privacy" className="privacy-link">
                  <span>Read Privacy Policy</span>
                  <ArrowRight size={14} />
                </Link>
                <Link to="/help" className="privacy-link secondary">
                  <HelpCircle size={14} />
                  <span>Camera Setup Guide</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="landing-cta-banner">
        <div className="landing-container banner-container">
          <div className="cta-banner-content">
            <h2 className="cta-banner-title">Start Monitoring Your Ergonomic Posture</h2>
            <p className="cta-banner-text">
              Sign in to your VertAIx workspace or register a profile to begin real-time posture telemetry.
            </p>
          </div>
          <div className="cta-banner-actions">
            {isAuthenticated ? (
              <Link to="/dashboard" className="cta-btn primary banner-btn">
                <span>Go to Dashboard</span>
                <ArrowRight size={18} />
              </Link>
            ) : (
              <Link to="/register" className="cta-btn primary banner-btn">
                <span>Create Free Profile</span>
                <ArrowRight size={18} />
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
