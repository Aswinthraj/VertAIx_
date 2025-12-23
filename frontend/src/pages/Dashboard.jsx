import React, { useState, useEffect, useRef } from 'react';
import { getPostureStatus, getLLMAdvice } from '../services/api';
import { toast } from 'react-toastify';
import { audioManager } from '../utils/audioManager';
import './Dashboard.css';

const Dashboard = () => {
  const [postureData, setPostureData] = useState({
    status: 'Loading...',
    pcs: 0,
    alert: false,
    sedentary_time: 0,
    recommendations: [],
    last_updated: null,
  });
  const [llmAdvice, setLlmAdvice] = useState('');
  const [displayedAdvice, setDisplayedAdvice] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [error, setError] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const previousStatusRef = useRef('');
  const alertShownRef = useRef(false);
  const typingIntervalRef = useRef(null);

  // Temporary userId until Firebase integration
  const userId = 'default_user';

  useEffect(() => {
    // Fetch posture data immediately on mount
    fetchPostureData();

    // Set up polling interval (every 1 second)
    const interval = setInterval(() => {
      fetchPostureData();
    }, 1000);

    // Fetch LLM advice on mount and every 30 seconds
    fetchLLMAdvice();
    const llmInterval = setInterval(() => {
      fetchLLMAdvice();
    }, 30000);

    // Cleanup intervals on component unmount
    return () => {
      clearInterval(interval);
      clearInterval(llmInterval);
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, []);

  // Typing effect when LLM advice changes
  useEffect(() => {
    if (!llmAdvice) return;

    // Clear any existing typing animation
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }

    setDisplayedAdvice('');
    setIsTyping(true);
    let charIndex = 0;

    typingIntervalRef.current = setInterval(() => {
      if (charIndex < llmAdvice.length) {
        setDisplayedAdvice(llmAdvice.substring(0, charIndex + 1));
        charIndex++;
      } else {
        clearInterval(typingIntervalRef.current);
        setIsTyping(false);
      }
    }, 30); // 30ms per character for smooth typing effect

    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, [llmAdvice]);

  const fetchPostureData = async () => {
    try {
      const data = await getPostureStatus(userId);
      
      // Check for status changes and show toast notifications
      if (previousStatusRef.current && previousStatusRef.current !== data.status) {
        if (data.status === 'Good Posture') {
          toast.success('✓ Great! Posture is now good!', {
            position: "top-right",
            autoClose: 3000,
          });
          if (soundEnabled) {
            audioManager.playSuccess();
          }
        } else if (data.status === 'Posture Warning') {
          toast.warning('⚠ Warning: Minor posture adjustment needed', {
            position: "top-right",
            autoClose: 4000,
          });
          if (soundEnabled) {
            audioManager.playWarning();
          }
        } else if (data.status === 'Bad Posture') {
          toast.error('✕ Alert: Bad posture detected! Please correct your position', {
            position: "top-right",
            autoClose: 5000,
          });
          if (soundEnabled) {
            audioManager.playAlert();
          }
        }
      }

      // Show persistent alert notification for bad posture
      if (data.alert && !alertShownRef.current) {
        toast.error('🚨 Posture Alert: Immediate correction required!', {
          position: "top-center",
          autoClose: 6000,
          style: { fontSize: '1.1rem', fontWeight: 'bold' }
        });
        if (soundEnabled && audioManager.shouldPlayAlert()) {
          audioManager.playAlert();
        }
        alertShownRef.current = true;
      } else if (!data.alert) {
        alertShownRef.current = false;
        audioManager.resetAlert();
      }

      previousStatusRef.current = data.status;
      setPostureData(data);
      setIsConnected(true);
      setError(null);
    } catch (err) {
      if (isConnected) {
        toast.error('Connection lost to backend server', {
          position: "bottom-left",
          autoClose: 5000,
        });
      }
      setIsConnected(false);
      setError('Unable to connect to backend');
      console.error('Failed to fetch posture data:', err);
    }
  };

  const fetchLLMAdvice = async () => {
    try {
      const data = await getLLMAdvice(userId);
      if (data.status === 'success' && data.advice) {
        setLlmAdvice(data.advice);
      }
    } catch (err) {
      console.error('Failed to fetch LLM advice:', err);
      // Silently fail - don't show error to user for LLM advice
    }
  };

  const getStatusColor = (status) => {
    if (status === 'Good Posture') return '#4caf50'; // Green
    if (status === 'Posture Warning') return '#ff9800'; // Yellow/Orange
    if (status === 'Bad Posture') return '#f44336'; // Red
    return '#757575'; // Gray for loading/unknown
  };

  const getStatusClass = (status) => {
    if (status === 'Good Posture') return 'status-good';
    if (status === 'Posture Warning') return 'status-warning';
    if (status === 'Bad Posture') return 'status-bad';
    return 'status-unknown';
  };

  return (
    <div className="dashboard">
      <main className="dashboard-content">
        {error && (
          <div className="error-banner">
            <strong>⚠ Error:</strong> {error}
          </div>
        )}

        {postureData.alert && (
          <div className="alert-banner">
            <strong>🚨 Alert:</strong> Poor posture detected! Please adjust your position.
          </div>
        )}

        <div className="dashboard-hero">
          <h1>VertAIx – Posture Detection Dashboard</h1>
          <div className={`connection-badge ${isConnected ? 'connected' : 'disconnected'}`}>
            <span className="status-dot"></span>
            {isConnected ? 'Live Monitoring' : 'Disconnected'}
          </div>
        </div>

        <div className="posture-cards">
          <div className="card status-card">
            <h2>Posture Status</h2>
            <div
              className={`status-value ${getStatusClass(postureData.status)}`}
              style={{ color: getStatusColor(postureData.status) }}
            >
              {postureData.status}
            </div>
          </div>

          <div className="card pcs-card">
            <h2>Posture Confidence Score</h2>
            <div className="pcs-value">
              {postureData.pcs !== null ? postureData.pcs.toFixed(2) : 'N/A'}
            </div>
            <div className="pcs-bar">
              <div
                className="pcs-fill"
                style={{
                  width: `${Math.min(Math.max(postureData.pcs, 0), 100)}%`,
                  backgroundColor: getStatusColor(postureData.status),
                }}
              ></div>
            </div>
          </div>

          <div className="card sedentary-card">
            <h2>Sedentary Time</h2>
            <div className="sedentary-value">
              {(postureData.sedentary_time / 60).toFixed(1)} min
            </div>
            <div className="sedentary-subtitle">
              Time spent sitting
            </div>
          </div>
        </div>

        {displayedAdvice && (
          <div className="llm-advice-section">
            <h3>
              🤖 AI Wellness Coach
              {isTyping && <span className="typing-indicator">▌</span>}
            </h3>
            <div className="llm-advice-card">
              <p className="llm-advice-text">{displayedAdvice}</p>
            </div>
          </div>
        )}

        {postureData.recommendations && postureData.recommendations.length > 0 && (
          <div className="recommendations-section">
            <h3>Quick Actions</h3>
            <ul className="recommendations-list">
              {postureData.recommendations.map((recommendation, index) => (
                <li key={index} className="recommendation-item">
                  <span className="recommendation-icon">💡</span>
                  {recommendation}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="info-section">
          <h3>Status Guide</h3>
          <div className="status-guide">
            <div className="guide-item">
              <span className="guide-color" style={{ backgroundColor: '#4caf50' }}></span>
              <span>Good Posture – Maintaining proper alignment</span>
            </div>
            <div className="guide-item">
              <span className="guide-color" style={{ backgroundColor: '#ff9800' }}></span>
              <span>Posture Warning – Minor adjustments needed</span>
            </div>
          </div>
        </div>

        <div className="sound-controls">
          <label className="sound-toggle">
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
            />
            <span className="toggle-label">
              {soundEnabled ? '🔊 Sound Alerts On' : '🔇 Sound Alerts Off'}
            </span>
          </label>
        </div>
      </main>

      <footer className="dashboard-footer">
        <p>Final Year Project © 2025 | Real-time posture monitoring system</p>
      </footer>
    </div>
  );
};

export default Dashboard;
