import React from 'react';
import { FileText, AlertTriangle, CheckCircle2, ShieldAlert, Activity } from 'lucide-react';
import './Legal.css';

const Terms = () => {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <header className="legal-header">
          <div className="legal-badge-row">
            <span className="legal-badge">
              <FileText size={14} />
              <span>Terms of Use</span>
            </span>
          </div>
          <h1 className="legal-title">Terms of Service</h1>
          <p className="legal-last-updated">Effective Date: October 2025</p>
        </header>

        <div className="legal-card">
          <div className="legal-alert-box warning">
            <strong>Important Medical Disclaimer:</strong> VertAIx is an engineering research and posture monitoring software tool. It is not a certified medical device and does NOT provide clinical diagnosis, medical treatment, or physiotherapy prescriptions.
          </div>

          {/* Section 1 */}
          <section className="legal-section">
            <h2 className="legal-section-title">
              <Activity size={18} />
              <span>1. Purpose &amp; Scope of Service</span>
            </h2>
            <p>
              VertAIx is designed to provide real-time computer-vision ergonomic posture estimation and continuous posture awareness for desktop computer users. By using the service, you acknowledge that all posture ratings, PCS scores, and ergonomic tips are informational indicators rather than clinical evaluations.
            </p>
          </section>

          {/* Section 2 */}
          <section className="legal-section">
            <h2 className="legal-section-title">
              <ShieldAlert size={18} />
              <span>2. Non-Medical Advice Disclaimer</span>
            </h2>
            <p>
              If you experience persistent musculoskeletal discomfort, spinal pain, neck strain, or any chronic symptoms, you should consult a licensed healthcare professional, physical therapist, or orthopedic physician. Do not disregard professional medical advice based on metrics produced by this software.
            </p>
          </section>

          {/* Section 3 */}
          <section className="legal-section">
            <h2 className="legal-section-title">
              <CheckCircle2 size={18} />
              <span>3. User Accounts &amp; Security</span>
            </h2>
            <p>
              Users are responsible for maintaining the confidentiality of their account credentials. You agree to notify VertAIx administrators immediately if you discover unauthorized access to your account.
            </p>
          </section>

          {/* Section 4 */}
          <section className="legal-section">
            <h2 className="legal-section-title">
              <AlertTriangle size={18} />
              <span>4. Operating Conditions &amp; Technical Limitations</span>
            </h2>
            <p>
              Accuracy of posture classification depends upon environmental factors including camera resolution, frame lighting, clothing contrast, and unobstructed visibility of upper-body anatomical landmarks (shoulders, nose, ears).
            </p>
          </section>

          {/* Section 5 */}
          <section className="legal-section">
            <h2 className="legal-section-title">
              <FileText size={18} />
              <span>5. Account Termination</span>
            </h2>
            <p>
              You may terminate your account at any time via the Account Settings console. Account deletion permanently removes your profile credentials and cascades to delete all stored posture history, session records, and authentication tokens.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Terms;
