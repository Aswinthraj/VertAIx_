import React from 'react';
import './BiometricSilhouette.css';

const BiometricSilhouette = ({
  neckAngle = 0,
  shoulderAngle = 0,
  spineAngle = 0,
  status = 'Good Posture',
  landmarksDetected = false
}) => {
  // Normalize angle inputs
  const neckPitch = Math.min(Math.max(Number(neckAngle) || 0, -45), 45);
  const shoulderTilt = Math.min(Math.max(Number(shoulderAngle) || 0, -30), 30);
  const spineBend = Math.min(Math.max(Number(spineAngle) || 0, -35), 35);

  // Status colors
  let primaryColor = '#10B981'; // Good - Emerald
  let stateTag = 'BALANCED';

  if (status === 'Bad Posture' || Math.abs(neckPitch) > 25 || Math.abs(shoulderTilt) > 15) {
    primaryColor = '#EF4444';
    stateTag = 'DEVIATION DETECTED';
  } else if (status === 'Posture Warning' || Math.abs(neckPitch) > 15 || Math.abs(shoulderTilt) > 8) {
    primaryColor = '#F59E0B';
    stateTag = 'FORWARD LEAN';
  }

  // Calculate dynamic SVG coordinates based on angles
  // Head center at base (150, 70), offsets by neckPitch
  const headOffsetX = neckPitch * 1.6;
  const headOffsetY = Math.abs(neckPitch) * 0.4;
  
  // Shoulder tilt offsets
  const leftShoulderY = 135 - shoulderTilt * 0.8;
  const rightShoulderY = 135 + shoulderTilt * 0.8;

  // Spine curve control points
  const thoracicCurveX = 150 + spineBend * 1.2;
  const lumbarCurveX = 150 + spineBend * 0.6;

  return (
    <div className="biometric-silhouette-card">
      <div className="silhouette-header">
        <div className="silhouette-header-text">
          <span className="silhouette-kicker">Biomechanical Skeleton</span>
          <h3 className="silhouette-heading">Live Pose Kinematics</h3>
        </div>
        <div className="tracking-status-chip">
          <span className={`tracking-dot ${landmarksDetected ? 'locked' : 'scanning'}`} />
          <span>{landmarksDetected ? 'MediaPipe Locked' : 'Tracking Active'}</span>
        </div>
      </div>

      <div className="silhouette-canvas-wrapper">
        {/* Background Ergonomic Reference Grid & Plumb Line */}
        <div className="ergonomic-grid-bg" />
        <div className="plumb-line" title="True Vertical Gravity Axis" />

        <svg className="biometric-svg" viewBox="0 0 300 320">
          <defs>
            <filter id="bioGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <radialGradient id="headGrad" cx="40%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#224566" />
              <stop offset="100%" stopColor="#102438" />
            </radialGradient>
          </defs>

          {/* Reference Neutral Posture Outline (Ghost) */}
          <g className="neutral-ghost-outline" opacity="0.25">
            <ellipse cx="150" cy="70" rx="24" ry="30" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="3 3" fill="none" />
            <line x1="150" y1="100" x2="150" y2="135" stroke="#94A3B8" strokeWidth="2" strokeDasharray="3 3" />
            <line x1="90" y1="135" x2="210" y2="135" stroke="#94A3B8" strokeWidth="2" strokeDasharray="3 3" />
            <line x1="150" y1="135" x2="150" y2="280" stroke="#94A3B8" strokeWidth="2" strokeDasharray="3 3" />
          </g>

          {/* Live Spinal Column Vertebrae Line */}
          <path
            d={`M ${150 + headOffsetX * 0.5} 105 Q ${thoracicCurveX} 190, ${lumbarCurveX} 240 T 150 290`}
            fill="none"
            stroke={primaryColor}
            strokeWidth="5"
            strokeLinecap="round"
            filter="url(#bioGlow)"
            className="spine-path"
          />

          {/* Spine Vertebrae Node Points */}
          {[120, 150, 185, 220, 255, 290].map((y, index) => {
            const factor = index / 5;
            const x = 150 + (spineBend * 1.2) * Math.sin(factor * Math.PI);
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="4.5"
                fill="#FFFFFF"
                stroke={primaryColor}
                strokeWidth="2"
                className="vertebra-node"
              />
            );
          })}

          {/* Live Clavicle / Shoulder Beam */}
          <line
            x1="85"
            y1={leftShoulderY}
            x2="215"
            y2={rightShoulderY}
            stroke={primaryColor}
            strokeWidth="4.5"
            strokeLinecap="round"
            filter="url(#bioGlow)"
          />

          {/* Shoulder Joints */}
          <circle cx="85" cy={leftShoulderY} r="7" fill="#17324D" stroke={primaryColor} strokeWidth="2.5" />
          <circle cx="215" cy={rightShoulderY} r="7" fill="#17324D" stroke={primaryColor} strokeWidth="2.5" />

          {/* Neck Link */}
          <line
            x1={150 + headOffsetX}
            y1={70 + headOffsetY + 25}
            x2="150"
            y2="135"
            stroke={primaryColor}
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Cervical Stress Ring (if forward lean) */}
          {Math.abs(neckPitch) > 15 && (
            <circle
              cx={150 + headOffsetX * 0.7}
              cy={115}
              r="14"
              fill="none"
              stroke="#EF4444"
              strokeWidth="2"
              strokeDasharray="4 2"
              className="stress-pulse-ring"
            />
          )}

          {/* Interactive Dynamic Cranium / Head */}
          <g
            className="head-group"
            style={{
              transform: `translate(${headOffsetX}px, ${headOffsetY}px) rotate(${neckPitch * 0.5}deg)`,
              transformOrigin: '150px 70px',
              transition: 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)'
            }}
          >
            {/* Cranium Head Silhouette */}
            <ellipse
              cx="150"
              cy="70"
              rx="24"
              ry="30"
              fill="url(#headGrad)"
              stroke={primaryColor}
              strokeWidth="2.5"
              filter="url(#bioGlow)"
            />
            {/* Face Orientation Direction Indicator (Nose Ray) */}
            <line
              x1="150"
              y1="70"
              x2="150"
              y2="40"
              stroke="rgba(255, 255, 255, 0.8)"
              strokeWidth="2"
              strokeDasharray="2 2"
            />
            <circle cx="150" cy="70" r="3" fill="#FFFFFF" />
            <circle cx="150" cy="40" r="2.5" fill="#22D3EE" />
          </g>

          {/* Angle Annotation callouts */}
          <g className="angle-callout">
            <text x="220" y="65" fill={primaryColor} fontSize="11" fontWeight="700" fontFamily="monospace">
              {`NECK ${neckPitch > 0 ? '+' : ''}${neckPitch.toFixed(1)}°`}
            </text>
            <text x="225" y={rightShoulderY + 5} fill="#64748B" fontSize="10" fontWeight="600" fontFamily="monospace">
              {`TILT ${shoulderTilt.toFixed(1)}°`}
            </text>
          </g>
        </svg>

        {/* Real-Time HUD Status Bar */}
        <div className="silhouette-hud-footer">
          <div className="hud-metric-pill">
            <span className="pill-label">Cervical Arc</span>
            <span className="pill-val" style={{ color: primaryColor }}>{Math.abs(neckPitch).toFixed(1)}°</span>
          </div>
          <div className="hud-metric-pill">
            <span className="pill-label">Shoulder Delta</span>
            <span className="pill-val">{Math.abs(shoulderTilt).toFixed(1)}°</span>
          </div>
          <div className="hud-metric-pill">
            <span className="pill-label">Alignment</span>
            <span className="pill-val" style={{ color: primaryColor }}>{stateTag}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BiometricSilhouette;
