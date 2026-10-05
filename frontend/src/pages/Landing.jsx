import React, { useState, useEffect } from 'react';
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
  HelpCircle,
  Zap,
  AlertTriangle
} from 'lucide-react';
import './Landing.css';

const DEMO_STATES = {
  good: {
    label: 'GOOD POSTURE',
    pcs: 94.2,
    engine: 'ML-Based (Random Forest)',
    neck: 6.5,
    shoulder: 1.8,
    spine: 3.2,
    status: 'OPTIMAL ALIGNMENT',
    alert: false,
    color: '#10B981',
    tip: 'Spinal curvature & cervical neck angle within optimal ergonomic thresholds.'
  },
  warning: {
    label: 'POSTURE WARNING',
    pcs: 63.8,
    engine: 'ML-Based (Random Forest)',
    neck: 21.4,
    shoulder: 7.2,
    spine: 14.8,
    status: 'FORWARD HEAD LEAN',
    alert: false,
    color: '#F59E0B',
    tip: 'Forward head tilt detected. Minor chin-tuck and display elevation recommended.'
  },
  bad: {
    label: 'BAD POSTURE',
    pcs: 36.5,
    engine: 'ML-Based (Random Forest)',
    neck: 33.2,
    shoulder: 16.5,
    spine: 27.0,
    status: 'CRITICAL DEVIATION',
    alert: true,
    color: '#EF4444',
    tip: 'Significant spinal slouch detected. Please sit upright and realign shoulders.'
  }
};

const Landing = () => {
  const { isAuthenticated } = useAuth();
  const [activeDemo, setActiveDemo] = useState('good');
  const [radarScanAngle, setRadarScanAngle] = useState(0);

  const currentData = DEMO_STATES[activeDemo];

  // Subtle continuous radar sweep animation
  useEffect(() => {
    const timer = setInterval(() => {
      setRadarScanAngle((prev) => (prev + 3) % 360);
    }, 40);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="landing-hero-section">
        <div className="landing-container hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-pulse" />
              <span>Real-Time Biometric Pose Telemetry</span>
            </div>
            
            <h1 className="hero-title">
              Precision Ergonomic Posture Telemetry <span className="highlight-text">Without Wearables</span>
            </h1>

            <p className="hero-description">
              VertAIx combines high-frequency computer vision pose tracking with trained machine learning classifiers to analyze sitting alignment, compute live Posture Confidence Scores (PCS), and deliver ergonomic advice directly in your browser.
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

          {/* Interactive Hero Biometric Telemetry Station */}
          <div className="hero-preview-panel">
            <div className="preview-terminal">
              <div className="terminal-header">
                <div className="terminal-dots">
                  <span className="dot red" />
                  <span className="dot yellow" />
                  <span className="dot green" />
                </div>
                <div className="terminal-title">
                  <ScanEye size={14} className="cyan-glow-icon" />
                  <span>runtime.telemetry.interactive</span>
                </div>
                <span className="terminal-status-pill" style={{ color: currentData.color, borderColor: currentData.color }}>
                  {currentData.status}
                </span>
              </div>

              {/* Interactive State Demo Selector */}
              <div className="hero-demo-selector">
                <span className="demo-selector-label">
                  <Zap size={13} />
                  <span>Interactive Posture Sandbox:</span>
                </span>
                <div className="demo-button-group">
                  <button
                    className={`demo-btn ${activeDemo === 'good' ? 'active-good' : ''}`}
                    onClick={() => setActiveDemo('good')}
                  >
                    Good (94%)
                  </button>
                  <button
                    className={`demo-btn ${activeDemo === 'warning' ? 'active-warn' : ''}`}
                    onClick={() => setActiveDemo('warning')}
                  >
                    Text Neck (64%)
                  </button>
                  <button
                    className={`demo-btn ${activeDemo === 'bad' ? 'active-bad' : ''}`}
                    onClick={() => setActiveDemo('bad')}
                  >
                    Slouch (36%)
                  </button>
                </div>
              </div>

              {/* Biometric Avatar & Kinematics Visualizer in Terminal */}
              <div className="terminal-visual-area">
                <div className="terminal-silhouette-box">
                  <svg className="hero-silhouette-svg" viewBox="0 0 200 180">
                    <defs>
                      <filter id="heroGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>

                    {/* Holographic Radar Sweep Line */}
                    <line
                      x1="100"
                      y1="90"
                      x2={100 + 80 * Math.cos((radarScanAngle * Math.PI) / 180)}
                      y2={90 + 80 * Math.sin((radarScanAngle * Math.PI) / 180)}
                      stroke="rgba(0, 212, 184, 0.25)"
                      strokeWidth="2"
                    />

                    {/* Neutral Reference Axis */}
                    <line x1="100" y1="20" x2="100" y2="160" stroke="rgba(255, 255, 255, 0.15)" strokeDasharray="3 3" />

                    {/* Animated Spine Vertebrae Path */}
                    <path
                      d={`M ${100 + currentData.neck * 1.1} 55 Q ${100 + currentData.spine * 1.2} 105, 100 160`}
                      fill="none"
                      stroke={currentData.color}
                      strokeWidth="4"
                      strokeLinecap="round"
                      filter="url(#heroGlow)"
                      style={{ transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                    />

                    {/* Clavicle / Shoulder Beam */}
                    <line
                      x1="60"
                      y1={75 - currentData.shoulder * 0.7}
                      x2="140"
                      y2={75 + currentData.shoulder * 0.7}
                      stroke={currentData.color}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      style={{ transition: 'all 0.5s ease' }}
                    />
                    <circle cx="60" cy={75 - currentData.shoulder * 0.7} r="5" fill="#0B132B" stroke={currentData.color} strokeWidth="2" />
                    <circle cx="140" cy={75 + currentData.shoulder * 0.7} r="5" fill="#0B132B" stroke={currentData.color} strokeWidth="2" />

                    {/* Cranium Head Silhouette */}
                    <ellipse
                      cx={100 + currentData.neck * 1.1}
                      cy={36}
                      rx="16"
                      ry="19"
                      fill="#1E293B"
                      stroke={currentData.color}
                      strokeWidth="2.5"
                      filter="url(#heroGlow)"
                      style={{ transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                    />
                  </svg>
                </div>

                {/* Score Dial & Live Angle Gauges */}
                <div className="terminal-metrics-box">
                  <div className="hero-pcs-display">
                    <span className="hero-pcs-num" style={{ color: currentData.color }}>
                      {currentData.pcs.toFixed(1)}%
                    </span>
                    <span className="hero-pcs-caption">POSTURE CONFIDENCE</span>
                  </div>

                  <div className="hero-angle-tags">
                    <div className="hero-angle-chip">
                      <span>Cervical Pitch:</span>
                      <strong style={{ color: currentData.color }}>{currentData.neck.toFixed(1)}°</strong>
                    </div>
                    <div className="hero-angle-chip">
                      <span>Clavicle Tilt:</span>
                      <strong>{currentData.shoulder.toFixed(1)}°</strong>
                    </div>
                    <div className="hero-angle-chip">
                      <span>Spine Angle:</span>
                      <strong>{currentData.spine.toFixed(1)}°</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Guidance Tip */}
              <div className="terminal-alert-box" style={{ borderColor: currentData.color }}>
                {currentData.alert ? (
                  <AlertTriangle size={16} style={{ color: currentData.color, flexShrink: 0 }} />
                ) : (
                  <CheckCircle2 size={16} style={{ color: currentData.color, flexShrink: 0 }} />
                )}
                <span>{currentData.tip}</span>
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
                MediaPipe Pose predicts 3D coordinates for facial and upper-body keypoints: nose, ears, shoulders, and clavicle anchors.
              </p>
            </div>

            <div className="step-card">
              <div className="step-icon-wrap">
                <Cpu size={24} />
                <span className="step-number">03</span>
              </div>
              <h3 className="step-card-title">Angular &amp; ML Classification</h3>
              <p className="step-card-text">
                Evaluates neck tilt, shoulder symmetry, and forward lean via trained Random Forest machine learning models.
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
                Continuous 0–100 score classifying posture state as <strong>Optimal</strong> (&ge;75%), <strong>Warning</strong> (50–74%), or <strong>Critical</strong> (&lt;50%).
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box">
                <Cpu size={22} />
              </div>
              <h3 className="feature-title">Trained ML Classification</h3>
              <p className="feature-description">
                Powered by a calibrated Random Forest classifier trained on 2,000+ real-world webcam posture frames for high accuracy.
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
