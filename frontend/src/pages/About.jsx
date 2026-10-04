import React from 'react';
import {
  ScanEye,
  Camera,
  Cpu,
  Layers,
  Activity,
  FileCode2,
  CheckCircle2,
  BookOpen
} from 'lucide-react';
import './About.css';

const About = () => {
  return (
    <div className="about-page">
      <div className="about-container">
        {/* Header */}
        <header className="about-header-card">
          <div className="header-badge-row">
            <h1 className="about-title">About VertAIx</h1>
            <span className="about-tag">Research & Engineering Documentation</span>
          </div>
          <p className="about-subtitle">
            A vision-based posture estimation and ergonomic monitoring system using MediaPipe and geometric classification
          </p>
        </header>

        {/* Project Overview */}
        <section className="about-card">
          <div className="section-header-group">
            <ScanEye size={20} className="section-icon" />
            <h2 className="section-title">System Overview</h2>
          </div>
          <p className="section-paragraph">
            VertAIx is an engineering research platform developed for real-time computer-vision ergonomic posture analysis. 
            By capturing continuous webcam video frames and estimating 33 spatial body landmarks via MediaPipe Pose, the system computes key biomechanical angles 
            (including head tilt, neck inclination, and shoulder alignment) to classify sitting posture as <strong>Good</strong>, <strong>Warning</strong>, or <strong>Bad</strong>.
          </p>
          <p className="section-paragraph">
            Unlike intrusive wearable sensors, VertAIx operates fully vision-based, generating a continuous Posture Confidence Score (PCS), 
            tracking cumulative sedentary periods, and dispatching instant ergonomic feedback to encourage healthy workplace alignment.
          </p>
        </section>

        {/* Technical Pipeline */}
        <section className="about-card">
          <div className="section-header-group">
            <Layers size={20} className="section-icon" />
            <h2 className="section-title">Computer-Vision Processing Pipeline</h2>
          </div>

          <div className="pipeline-grid">
            <div className="pipeline-step">
              <div className="step-badge">
                <Camera size={18} />
                <span className="step-num">01</span>
              </div>
              <h3 className="step-title">Frame Acquisition</h3>
              <p className="step-desc">
                Continuous video capture via OpenCV capturing user upper-body posture at steady sampling intervals.
              </p>
            </div>

            <div className="pipeline-step">
              <div className="step-badge">
                <ScanEye size={18} />
                <span className="step-num">02</span>
              </div>
              <h3 className="step-title">Pose Landmark Estimation</h3>
              <p className="step-desc">
                Extraction of 3D anatomical keypoints (nose, ears, shoulders, hips) using Google MediaPipe Pose models.
              </p>
            </div>

            <div className="pipeline-step">
              <div className="step-badge">
                <Cpu size={18} />
                <span className="step-num">03</span>
              </div>
              <h3 className="step-title">Biomechanic Classification</h3>
              <p className="step-desc">
                Dual classification engine: geometric angular rule verification or trained ML classifier evaluating alignment deviations.
              </p>
            </div>

            <div className="pipeline-step">
              <div className="step-badge">
                <Activity size={18} />
                <span className="step-num">04</span>
              </div>
              <h3 className="step-title">Telemetry & Scoring</h3>
              <p className="step-desc">
                Computation of the Posture Confidence Score (PCS), sedentary timer accumulation, and live ergonomic feedback.
              </p>
            </div>
          </div>
        </section>

        {/* Technology Architecture */}
        <section className="about-card">
          <div className="section-header-group">
            <FileCode2 size={20} className="section-icon" />
            <h2 className="section-title">Technology Stack</h2>
          </div>

          <div className="tech-stack-grid">
            <div className="tech-card">
              <span className="tech-category">Frontend Client</span>
              <strong className="tech-name">React & Vanilla CSS</strong>
              <p className="tech-details">Single-page application with Recharts telemetry visualization and Lucide icons.</p>
            </div>

            <div className="tech-card">
              <span className="tech-category">Computer Vision</span>
              <strong className="tech-name">MediaPipe & OpenCV</strong>
              <p className="tech-details">Real-time landmark detection and video frame processing pipeline in Python.</p>
            </div>

            <div className="tech-card">
              <span className="tech-category">Backend API</span>
              <strong className="tech-name">Python FastAPI Server</strong>
              <p className="tech-details">High-performance async telemetry endpoints, camera worker integration, and analytics tracking.</p>
            </div>

            <div className="tech-card">
              <span className="tech-category">Authentication & DB</span>
              <strong className="tech-name">JWT & PostgreSQL / Alembic</strong>
              <p className="tech-details">Secure JWT token authentication, refresh rotation, and versioned PostgreSQL database schema.</p>
            </div>
          </div>
        </section>

        {/* Academic & Project Context */}
        <section className="about-card">
          <div className="section-header-group">
            <BookOpen size={20} className="section-icon" />
            <h2 className="section-title">Project & Research Scope</h2>
          </div>

          <div className="scope-list">
            <div className="scope-item">
              <CheckCircle2 size={16} className="scope-icon" />
              <span>Evaluate non-invasive computer vision for desktop ergonomic posture classification.</span>
            </div>
            <div className="scope-item">
              <CheckCircle2 size={16} className="scope-icon" />
              <span>Provide empirical posture confidence metrics (PCS) based on geometric spatial angles.</span>
            </div>
            <div className="scope-item">
              <CheckCircle2 size={16} className="scope-icon" />
              <span>Support dual-engine evaluation comparing explicit geometric rules with trained machine learning models.</span>
            </div>
            <div className="scope-item">
              <CheckCircle2 size={16} className="scope-icon" />
              <span>Promote proactive ergonomic awareness through continuous sedentary duration monitoring.</span>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="about-footer-card">
          <p className="footer-title">VertAIx — Vision-Based Posture Monitoring System</p>
          <p className="footer-meta">Final Year Engineering Research Project • 2025</p>
        </footer>
      </div>
    </div>
  );
};

export default About;
