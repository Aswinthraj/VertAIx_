import React from 'react';
import './About.css';

const About = () => {
  return (
    <div className="about-page">
      <div className="about-header">
        <h1>ℹ️ About VertAIx</h1>
        <p>AI-Powered Posture Detection System</p>
      </div>

      <div className="about-container">
        <div className="about-section">
          <h2>🎯 Project Overview</h2>
          <p>
            VertAIx is an intelligent posture detection system developed as a final-year project. 
            The system uses advanced computer vision and machine learning techniques to monitor 
            and analyze human posture in real-time, providing immediate feedback and alerts to 
            help users maintain proper ergonomic positioning.
          </p>
        </div>

        <div className="about-section">
          <h2>✨ Key Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🎥</div>
              <h3>Real-Time Monitoring</h3>
              <p>Continuous posture analysis using webcam feed</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3>AI-Powered Detection</h3>
              <p>Machine learning models for accurate posture classification</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Analytics Dashboard</h3>
              <p>Comprehensive statistics and insights</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🚨</div>
              <h3>Smart Alerts</h3>
              <p>Instant notifications for poor posture</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📈</div>
              <h3>Progress Tracking</h3>
              <p>Historical data and improvement metrics</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚙️</div>
              <h3>Customizable Settings</h3>
              <p>Personalized alerts and monitoring options</p>
            </div>
          </div>
        </div>

        <div className="about-section">
          <h2>🛠️ Technology Stack</h2>
          <div className="tech-grid">
            <div className="tech-item">
              <strong>Frontend:</strong>
              <span>React.js, React Router, Axios</span>
            </div>
            <div className="tech-item">
              <strong>Backend:</strong>
              <span>Python, Flask, OpenCV</span>
            </div>
            <div className="tech-item">
              <strong>ML/AI:</strong>
              <span>MediaPipe, TensorFlow, Computer Vision</span>
            </div>
            <div className="tech-item">
              <strong>Styling:</strong>
              <span>CSS3, Responsive Design</span>
            </div>
          </div>
        </div>

        <div className="about-section">
          <h2>📋 How It Works</h2>
          <div className="workflow">
            <div className="workflow-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Capture</h3>
                <p>Webcam captures real-time video feed</p>
              </div>
            </div>
            <div className="workflow-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Analyze</h3>
                <p>AI models detect body landmarks and angles</p>
              </div>
            </div>
            <div className="workflow-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Classify</h3>
                <p>System classifies posture as Good, Warning, or Bad</p>
              </div>
            </div>
            <div className="workflow-step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h3>Alert</h3>
                <p>User receives immediate feedback and recommendations</p>
              </div>
            </div>
          </div>
        </div>

        <div className="about-section">
          <h2>🎓 Academic Information</h2>
          <div className="academic-info">
            <div className="info-row">
              <span className="info-label">Project Type:</span>
              <span className="info-value">Live In Lab Project</span>
            </div>
            <div className="info-row">
              <span className="info-label">Domain:</span>
              <span className="info-value">Computer Vision & Machine Learning</span>
            </div>
            <div className="info-row">
              <span className="info-label">Year:</span>
              <span className="info-value">2025</span>
            </div>
            <div className="info-row">
              <span className="info-label">Status:</span>
              <span className="info-value status-active">✓ Active Development</span>
            </div>
          </div>
        </div>

        <div className="about-section">
          <h2>💡 Project Goals</h2>
          <ul className="goals-list">
            <li>Promote better posture awareness and ergonomic practices</li>
            <li>Reduce health issues related to poor sitting posture</li>
            <li>Provide an accessible, user-friendly monitoring solution</li>
            <li>Demonstrate practical application of AI in healthcare</li>
            <li>Create a scalable system for workplace wellness programs</li>
          </ul>
        </div>

        <div className="about-footer">
          <div className="footer-content">
            <p>© 2025 VertAIx - Posture Detection System</p>
            <p className="footer-tagline">Built with ❤️ for better health and productivity</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
