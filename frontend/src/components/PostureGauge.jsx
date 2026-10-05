import React from 'react';
import './PostureGauge.css';

const PostureGauge = ({ score = 0, status = 'Good Posture', alert = false }) => {
  const safeScore = Math.min(Math.max(Number(score) || 0, 0), 100);
  
  // Radius and circumference for SVG circle
  const radius = 95;
  const circumference = 2 * Math.PI * radius;
  // Arc spans 260 degrees (leaving 100 deg open at bottom)
  const arcPercentage = 0.72;
  const strokeDashoffset = circumference - (safeScore / 100) * (circumference * arcPercentage);

  // Dynamic theme colors based on score
  let color = '#10B981'; // Emerald
  let glowColor = 'rgba(16, 185, 129, 0.4)';
  let rating = 'OPTIMAL';
  let badgeClass = 'gauge-optimal';

  if (safeScore < 50 || status === 'Bad Posture' || alert) {
    color = '#EF4444'; // Red
    glowColor = 'rgba(239, 68, 68, 0.45)';
    rating = 'CRITICAL';
    badgeClass = 'gauge-critical';
  } else if (safeScore < 75 || status === 'Posture Warning') {
    color = '#F59E0B'; // Amber
    glowColor = 'rgba(245, 158, 11, 0.4)';
    rating = 'ATTENTION';
    badgeClass = 'gauge-attention';
  }

  // Needle angle from -130deg to +130deg
  const needleRotation = -130 + (safeScore / 100) * 260;

  return (
    <div className={`posture-gauge-card ${alert ? 'alert-pulsing' : ''}`}>
      <div className="gauge-header">
        <div className="gauge-title-group">
          <span className="gauge-kicker">Biometric Posture Confidence</span>
          <h3 className="gauge-heading">Live PCS Radar</h3>
        </div>
        <span className={`gauge-badge ${badgeClass}`}>
          <span className="badge-dot" style={{ backgroundColor: color }} />
          {rating}
        </span>
      </div>

      <div className="gauge-visual-wrapper">
        <svg className="gauge-svg" viewBox="0 0 240 240">
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06B6D4" />
              <stop offset="50%" stopColor="#10B981" />
              <stop offset="85%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#EF4444" />
            </linearGradient>
            <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Track Arc */}
          <circle
            cx="120"
            cy="120"
            r={radius}
            className="gauge-track-bg"
            strokeWidth="14"
            strokeDasharray={`${circumference * arcPercentage} ${circumference * (1 - arcPercentage)}`}
            strokeDashoffset="0"
            transform="rotate(140 120 120)"
          />

          {/* Active Animated Value Arc */}
          <circle
            cx="120"
            cy="120"
            r={radius}
            className="gauge-track-fill"
            stroke={color}
            strokeWidth="14"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(140 120 120)"
            filter="url(#gaugeGlow)"
            style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.5s ease' }}
          />

          {/* Tick Marks around Arc */}
          {[0, 25, 50, 75, 100].map((tick, i) => {
            const tickAngle = -130 + (tick / 100) * 260;
            const rad = (tickAngle - 90) * (Math.PI / 180);
            const x1 = 120 + (radius - 12) * Math.cos(rad);
            const y1 = 120 + (radius - 12) * Math.sin(rad);
            const x2 = 120 + (radius + 2) * Math.cos(rad);
            const y2 = 120 + (radius + 2) * Math.sin(rad);
            return (
              <g key={i}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="rgba(100, 116, 139, 0.4)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </g>
            );
          })}

          {/* Center Needle & Pivot */}
          <g
            className="gauge-needle-group"
            style={{
              transform: `rotate(${needleRotation}deg)`,
              transformOrigin: '120px 120px',
              transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            <polygon
              points="120,45 116,120 124,120"
              fill={color}
              filter="url(#gaugeGlow)"
            />
            <circle cx="120" cy="120" r="9" fill="#17324D" stroke={color} strokeWidth="3" />
            <circle cx="120" cy="120" r="3" fill="#FFFFFF" />
          </g>
        </svg>

        {/* Center Digital Metric Readout */}
        <div className="gauge-center-content">
          <div className="gauge-score-value" style={{ color: color, textShadow: `0 0 20px ${glowColor}` }}>
            {safeScore.toFixed(1)}
          </div>
          <div className="gauge-score-label">PCS INDEX</div>
        </div>
      </div>

      <div className="gauge-scale-footer">
        <span className="scale-stop left">0 (Poor)</span>
        <div className="scale-zone-indicators">
          <span className="zone-dot red" title="0-49: Critical Deviation" />
          <span className="zone-dot yellow" title="50-74: Warning" />
          <span className="zone-dot green" title="75-100: Optimal" />
        </div>
        <span className="scale-stop right">100 (Optimal)</span>
      </div>
    </div>
  );
};

export default PostureGauge;
