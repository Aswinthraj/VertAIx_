import React from 'react';
import {
  ScanEye,
  Camera,
  Cpu,
  CheckCircle2,
  ShieldAlert,
  Sliders
} from 'lucide-react';
import './About.css';

const About = () => {
  return (
    <div className="about-page">
      <div className="about-container">
        {/* Header */}
        <header className="about-header-card">
          <div className="header-badge-row">
            <span className="about-tag">
              <ScanEye size={14} />
              <span>Computer-Vision System</span>
            </span>
          </div>
          <h1 className="about-title">About VertAIx</h1>
          <p className="about-subtitle">
            Vision-based upper-body posture estimation and ergonomic monitoring without intrusive wearables
          </p>
        </header>

        {/* Section 1: Problem & Mission */}
        <section className="about-card">
          <div className="section-header-group">
            <div className="about-icon-badge">
              <ScanEye size={20} />
            </div>
            <h2 className="section-title">What is VertAIx?</h2>
          </div>
          <p className="section-paragraph">
            VertAIx is an engineering research platform designed to address the pervasive challenge of poor sitting posture during prolonged desk work. Traditional posture tracking often requires cumbersome body-worn sensors or dedicated hardware clips. VertAIx takes a software-defined, vision-based approach using standard webcam video input.
          </p>
          <p className="section-paragraph">
            By analyzing upper-body geometry in real time, the system measures forward neck tilt, shoulder elevation asymmetry, and torso slouching to generate immediate posture feedback and maintain a continuous Posture Confidence Score (PCS).
          </p>
        </section>

        {/* Section 2: How Posture Monitoring Works */}
        <section className="about-card">
          <div className="section-header-group">
            <div className="about-icon-badge">
              <Camera size={20} />
            </div>
            <h2 className="section-title">How Posture Monitoring Works</h2>
          </div>

          <div className="pipeline-grid">
            <div className="pipeline-step">
              <div className="step-badge">
                <span className="step-num">01</span>
              </div>
              <h3 className="step-title">Video Acquisition</h3>
              <p className="step-desc">
                Local camera frames capture upper-body positioning at steady sampling intervals without storing or transmitting raw video footage.
              </p>
            </div>

            <div className="pipeline-step">
              <div className="step-badge">
                <span className="step-num">02</span>
              </div>
              <h3 className="step-title">Pose Keypoint Estimation</h3>
              <p className="step-desc">
                Extracts 33 spatial anatomical keypoints (eyes, ears, nose, shoulders, and hips) using MediaPipe Pose models.
              </p>
            </div>

            <div className="pipeline-step">
              <div className="step-badge">
                <span className="step-num">03</span>
              </div>
              <h3 className="step-title">Biomechanical Geometry</h3>
              <p className="step-desc">
                Calculates spatial angles including ear-to-shoulder neck inclination, shoulder lateral tilt, and horizontal alignment relative to calibrated baselines.
              </p>
            </div>

            <div className="pipeline-step">
              <div className="step-badge">
                <span className="step-num">04</span>
              </div>
              <h3 className="step-title">Scoring &amp; Feedback</h3>
              <p className="step-desc">
                Applies a 30-frame rolling smoothing buffer to output the Posture Confidence Score (PCS), cumulative sedentary duration, and ergonomic alert cues.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Dual Detection Engines */}
        <section className="about-card">
          <div className="section-header-group">
            <div className="about-icon-badge">
              <Cpu size={20} />
            </div>
            <h2 className="section-title">Dual Classification Architecture</h2>
          </div>
          <p className="section-paragraph">
            VertAIx supports two independent classification mechanisms to enable comparative posture evaluation:
          </p>

          <div className="dual-mode-grid">
            <div className="dual-mode-card">
              <div className="mode-badge-pill">
                <Sliders size={14} />
                <span>Deterministic</span>
              </div>
              <h3 className="dual-mode-title">Rule-Based Detection</h3>
              <p className="dual-mode-text">
                Computes explicit geometric angles from keypoint coordinates and compares them against established ergonomic threshold boundaries (neck inclination &le; 20°, shoulder tilt &le; 10°).
              </p>
            </div>

            <div className="dual-mode-card">
              <div className="mode-badge-pill">
                <Cpu size={14} />
                <span>Machine Learning</span>
              </div>
              <h3 className="dual-mode-title">Random Forest Classifier</h3>
              <p className="dual-mode-text">
                Evaluates landmark spatial feature vectors through a trained Random Forest model to classify complex multi-joint posture states based on empirical training data.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: Responsible-Use & Limitations */}
        <section className="about-card">
          <div className="section-header-group">
            <div className="about-icon-badge">
              <ShieldAlert size={20} />
            </div>
            <h2 className="section-title">Responsible Use &amp; Limitations</h2>
          </div>

          <div className="limitations-list">
            <div className="limitation-item">
              <CheckCircle2 size={16} className="limit-icon" />
              <span><strong>Non-Clinical Scope:</strong> VertAIx is an engineering monitoring tool and does not provide clinical orthopedic diagnoses, medical therapy, or treatment regimens.</span>
            </div>
            <div className="limitation-item">
              <CheckCircle2 size={16} className="limit-icon" />
              <span><strong>Optical Limitations:</strong> Posture accuracy depends on webcam positioning, lighting, and unobstructed visibility of upper-body landmarks.</span>
            </div>
            <div className="limitation-item">
              <CheckCircle2 size={16} className="limit-icon" />
              <span><strong>Ergonomic Awareness:</strong> The system is designed to build proactive postural mindfulness and encourage periodic movement breaks during desk work.</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;
