import React from 'react';
import { Compass, MoveVertical, ShieldCheck } from 'lucide-react';
import './AngleTelemetryGauges.css';

const AngleTelemetryGauges = ({
  neckAngle = 0,
  shoulderAngle = 0,
  spineAngle = 0
}) => {
  const neck = Number(neckAngle) || 0;
  const shoulder = Number(shoulderAngle) || 0;
  const spine = Number(spineAngle) || 0;

  // Neck angle evaluation (Ideal: <15 deg, Warning: 15-25 deg, Critical: >25 deg)
  const neckMax = 45;
  const neckPct = Math.min(Math.max((Math.abs(neck) / neckMax) * 100, 0), 100);
  const isNeckGood = Math.abs(neck) <= 15;
  const isNeckWarn = Math.abs(neck) > 15 && Math.abs(neck) <= 25;

  // Shoulder tilt evaluation (Ideal: <5 deg, Warning: 5-10 deg, Critical: >10 deg)
  const shoulderMax = 20;
  const shoulderPct = Math.min(Math.max((Math.abs(shoulder) / shoulderMax) * 100, 0), 100);
  const isShoulderGood = Math.abs(shoulder) <= 5;
  const isShoulderWarn = Math.abs(shoulder) > 5 && Math.abs(shoulder) <= 10;

  // Spine inclination evaluation (Ideal: <12 deg, Warning: 12-22 deg, Critical: >22 deg)
  const spineMax = 30;
  const spinePct = Math.min(Math.max((Math.abs(spine) / spineMax) * 100, 0), 100);
  const isSpineGood = Math.abs(spine) <= 12;
  const isSpineWarn = Math.abs(spine) > 12 && Math.abs(spine) <= 22;

  const getStatusColor = (isGood, isWarn) => {
    if (isGood) return '#10B981';
    if (isWarn) return '#F59E0B';
    return '#EF4444';
  };

  const getStatusLabel = (isGood, isWarn) => {
    if (isGood) return 'Optimal';
    if (isWarn) return 'Moderate Tilt';
    return 'Severe Strain';
  };

  return (
    <div className="angle-gauges-grid">
      {/* 1. Cervical Neck Angle Gauge */}
      <div className="angle-meter-card">
        <div className="meter-card-header">
          <div className="meter-icon-wrap" style={{ color: getStatusColor(isNeckGood, isNeckWarn) }}>
            <MoveVertical size={16} />
          </div>
          <div className="meter-info">
            <span className="meter-name">Cervical Pitch</span>
            <span className="meter-ideal">Target: &lt; 15.0°</span>
          </div>
          <span
            className={`meter-status-pill ${isNeckGood ? 'good' : isNeckWarn ? 'warn' : 'bad'}`}
          >
            {getStatusLabel(isNeckGood, isNeckWarn)}
          </span>
        </div>

        <div className="meter-val-row">
          <span className="meter-val" style={{ color: getStatusColor(isNeckGood, isNeckWarn) }}>
            {neck.toFixed(1)}°
          </span>
          <span className="meter-sub">Head forward incline</span>
        </div>

        <div className="meter-track">
          <div
            className="meter-fill"
            style={{
              width: `${neckPct}%`,
              backgroundColor: getStatusColor(isNeckGood, isNeckWarn)
            }}
          />
          <div className="meter-threshold-marker" style={{ left: '33%' }} title="15° Warning Threshold" />
        </div>
      </div>

      {/* 2. Shoulder Balance Gauge */}
      <div className="angle-meter-card">
        <div className="meter-card-header">
          <div className="meter-icon-wrap" style={{ color: getStatusColor(isShoulderGood, isShoulderWarn) }}>
            <Compass size={16} />
          </div>
          <div className="meter-info">
            <span className="meter-name">Clavicle Tilt</span>
            <span className="meter-ideal">Target: &lt; 5.0°</span>
          </div>
          <span
            className={`meter-status-pill ${isShoulderGood ? 'good' : isShoulderWarn ? 'warn' : 'bad'}`}
          >
            {getStatusLabel(isShoulderGood, isShoulderWarn)}
          </span>
        </div>

        <div className="meter-val-row">
          <span className="meter-val" style={{ color: getStatusColor(isShoulderGood, isShoulderWarn) }}>
            {shoulder.toFixed(1)}°
          </span>
          <span className="meter-sub">Lateral shoulder level</span>
        </div>

        <div className="meter-track">
          <div
            className="meter-fill"
            style={{
              width: `${shoulderPct}%`,
              backgroundColor: getStatusColor(isShoulderGood, isShoulderWarn)
            }}
          />
          <div className="meter-threshold-marker" style={{ left: '25%' }} title="5° Warning Threshold" />
        </div>
      </div>

      {/* 3. Spinal Arc Inclination Gauge */}
      <div className="angle-meter-card">
        <div className="meter-card-header">
          <div className="meter-icon-wrap" style={{ color: getStatusColor(isSpineGood, isSpineWarn) }}>
            <ShieldCheck size={16} />
          </div>
          <div className="meter-info">
            <span className="meter-name">Spine Inclination</span>
            <span className="meter-ideal">Target: &lt; 12.0°</span>
          </div>
          <span
            className={`meter-status-pill ${isSpineGood ? 'good' : isSpineWarn ? 'warn' : 'bad'}`}
          >
            {getStatusLabel(isSpineGood, isSpineWarn)}
          </span>
        </div>

        <div className="meter-val-row">
          <span className="meter-val" style={{ color: getStatusColor(isSpineGood, isSpineWarn) }}>
            {spine.toFixed(1)}°
          </span>
          <span className="meter-sub">Thoracic & lumbar bend</span>
        </div>

        <div className="meter-track">
          <div
            className="meter-fill"
            style={{
              width: `${spinePct}%`,
              backgroundColor: getStatusColor(isSpineGood, isSpineWarn)
            }}
          />
          <div className="meter-threshold-marker" style={{ left: '40%' }} title="12° Warning Threshold" />
        </div>
      </div>
    </div>
  );
};

export default AngleTelemetryGauges;
