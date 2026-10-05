import React, { useState, useEffect } from 'react';
import { X, Sparkles, HeartPulse, Check, Play, Pause } from 'lucide-react';
import './BreathingModal.css';

const STAGES = [
  { label: 'Inhale Slowly', duration: 4, instruction: 'Expand your chest and roll your shoulders gently back.' },
  { label: 'Hold Breath', duration: 4, instruction: 'Keep your spine upright and align chin over chest.' },
  { label: 'Exhale Fully', duration: 4, instruction: 'Release all upper neck and shoulder tension.' },
  { label: 'Rest & Reset', duration: 4, instruction: 'Feel the natural neutral curvature of your spine.' }
];

const BreathingModal = ({ isOpen, onClose }) => {
  const [stageIndex, setStageIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(4);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!isOpen || !isActive) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setStageIndex((currentStage) => {
            const nextStage = (currentStage + 1) % STAGES.length;
            if (nextStage === 0) {
              setCyclesCompleted((c) => c + 1);
            }
            return nextStage;
          });
          return STAGES[(stageIndex + 1) % STAGES.length].duration;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isActive, stageIndex]);

  if (!isOpen) return null;

  const currentStage = STAGES[stageIndex];

  return (
    <div className="breathing-modal-backdrop" onClick={onClose}>
      <div className="breathing-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close Modal">
          <X size={20} />
        </button>

        <div className="modal-header">
          <div className="modal-icon-badge">
            <HeartPulse size={20} />
          </div>
          <div>
            <h3 className="modal-title">Ergonomic Micro-Break</h3>
            <p className="modal-subtitle">4-4-4-4 Box Breathing & Postural Decompression</p>
          </div>
        </div>

        {/* Animated Expanding Breathing Circle */}
        <div className="breathing-circle-container">
          <div className={`breathing-halo-ring ${stageIndex === 0 ? 'expand' : stageIndex === 2 ? 'contract' : 'hold'}`} />
          <div className={`breathing-center-circle ${stageIndex === 0 ? 'expand' : stageIndex === 2 ? 'contract' : 'hold'}`}>
            <span className="breathing-timer-number">{secondsLeft}s</span>
            <span className="breathing-stage-tag">{currentStage.label}</span>
          </div>
        </div>

        <div className="stage-instruction-box">
          <Sparkles size={16} className="sparkle-icon" />
          <p className="instruction-text">{currentStage.instruction}</p>
        </div>

        <div className="modal-footer-controls">
          <div className="cycles-counter">
            <span>Completed Cycles: <strong>{cyclesCompleted}</strong></span>
          </div>

          <div className="action-buttons">
            <button
              className="control-btn"
              onClick={() => setIsActive(!isActive)}
            >
              {isActive ? <Pause size={14} /> : <Play size={14} />}
              <span>{isActive ? 'Pause' : 'Resume'}</span>
            </button>
            <button className="finish-btn" onClick={onClose}>
              <Check size={14} />
              <span>Finish Break</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BreathingModal;
