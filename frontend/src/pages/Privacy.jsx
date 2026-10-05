import React from 'react';
import { ShieldCheck, Camera, Database, Lock, Trash2, Cpu } from 'lucide-react';
import './Legal.css';

const Privacy = () => {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <header className="legal-header">
          <div className="legal-badge-row">
            <span className="legal-badge">
              <ShieldCheck size={14} />
              <span>Data Protection</span>
            </span>
          </div>
          <h1 className="legal-title">Privacy Policy</h1>
          <p className="legal-last-updated">Effective Date: October 2025</p>
        </header>

        <div className="legal-card">
          <div className="legal-alert-box">
            <strong>Key Principle:</strong> VertAIx processes live camera frames in memory for landmark estimation. Video recordings are never saved, stored to disk, or transmitted over the network.
          </div>

          {/* Section 1 */}
          <section className="legal-section">
            <h2 className="legal-section-title">
              <Camera size={18} />
              <span>1. Camera Stream &amp; Computer-Vision Processing</span>
            </h2>
            <p>
              When you activate a monitoring session, the VertAIx background worker accesses your local webcam video stream to extract 33 anatomical landmark coordinates via Google MediaPipe Pose.
            </p>
            <ul className="legal-list">
              <li>
                <span className="legal-list-bullet">•</span>
                <span><strong>No Video Storage:</strong> Raw image frames exist only in volatile working memory during frame analysis and are immediately discarded.</span>
              </li>
              <li>
                <span className="legal-list-bullet">•</span>
                <span><strong>No Video Uploads:</strong> Video frames are never uploaded to any remote server or external cloud storage.</span>
              </li>
              <li>
                <span className="legal-list-bullet">•</span>
                <span><strong>Coordinate Extraction Only:</strong> Only computed numerical data (joint angles, tilt degrees, landmark coordinates) is derived from frames.</span>
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="legal-section">
            <h2 className="legal-section-title">
              <Database size={18} />
              <span>2. Telemetry Data Collected &amp; Stored</span>
            </h2>
            <p>
              To provide historical charts and posture analytics, VertAIx stores numerical telemetry in the application database:
            </p>
            <ul className="legal-list">
              <li>
                <span className="legal-list-bullet">•</span>
                <span><strong>Posture Status &amp; PCS:</strong> Classification label (Good, Warning, Bad) and continuous Posture Confidence Score (0–100%).</span>
              </li>
              <li>
                <span className="legal-list-bullet">•</span>
                <span><strong>Biomechanical Angles:</strong> Neck inclination, shoulder tilt, and torso alignment metrics.</span>
              </li>
              <li>
                <span className="legal-list-bullet">•</span>
                <span><strong>Session &amp; Sedentary Time:</strong> Session start/end timestamps and cumulative sedentary duration.</span>
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="legal-section">
            <h2 className="legal-section-title">
              <Lock size={18} />
              <span>3. Account &amp; Authentication Security</span>
            </h2>
            <p>
              When creating an account, we collect your display username, email address, and a securely salted password hash (Argon2 / Bcrypt). Passwords are never stored or logged in plain text. Session authentication uses JSON Web Tokens (JWT) and secure refresh tokens.
            </p>
          </section>

          {/* Section 4 */}
          <section className="legal-section">
            <h2 className="legal-section-title">
              <Cpu size={18} />
              <span>4. AI Ergonomic Guidance</span>
            </h2>
            <p>
              When ergonomic advice is requested, an anonymized numerical summary of your current session (e.g. average PCS score and primary posture state) is sent to the configured language model service (Groq API) to generate contextual posture tips. No personal account identifiers, emails, or images are transmitted.
            </p>
          </section>

          {/* Section 5 */}
          <section className="legal-section">
            <h2 className="legal-section-title">
              <Trash2 size={18} />
              <span>5. User Rights &amp; Account Deletion</span>
            </h2>
            <p>
              You maintain complete ownership of your telemetry data:
            </p>
            <ul className="legal-list">
              <li>
                <span className="legal-list-bullet">•</span>
                <span><strong>Export:</strong> Download your entire posture history in standard CSV format at any time.</span>
              </li>
              <li>
                <span className="legal-list-bullet">•</span>
                <span><strong>Clear Logs:</strong> Reset or delete telemetry history records directly from the History console.</span>
              </li>
              <li>
                <span className="legal-list-bullet">•</span>
                <span><strong>Account Deletion:</strong> Permanently delete your account and all associated telemetry, sessions, and tokens from Settings.</span>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
