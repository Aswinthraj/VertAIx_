import React, { useState, useEffect, useRef } from 'react';
import {
  getPostureStatus,
  getLLMAdvice,
  startSession,
  getAnalytics,
  setDetectionMode,
  getDetectionMode,
  getHistory
} from '../services/api';
import { toast } from 'react-toastify';
import { audioManager } from '../utils/audioManager';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area
} from 'recharts';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  ShieldCheck,
  Clock,
  Volume2,
  VolumeX,
  Radio,
  Sliders,
  Sparkles,
  RefreshCw,
  TrendingUp,
  Cpu,
  Layers
} from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const [postureData, setPostureData] = useState({
    status: 'Connecting...',
    pcs: 0,
    alert: false,
    sedentary_time: 0,
    recommendations: [],
    last_updated: null,
  });

  const [guidanceAdvice, setGuidanceAdvice] = useState('');
  const [displayedGuidance, setDisplayedGuidance] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [error, setError] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [detectionMode, setDetectionModeState] = useState('rule');
  const [modeLoading, setModeLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [pcsHistory, setPcsHistory] = useState([]);

  const previousStatusRef = useRef('');
  const alertShownRef = useRef(false);
  const typingIntervalRef = useRef(null);

  // Initialize session and poll data
  useEffect(() => {
    // Ensure active session continues
    startSession().catch(err => {
      console.debug('Session ensure skipped/active:', err);
    });

    // Preload recent PCS telemetry trend points from database
    getHistory(30)
      .then(res => {
        if (res && res.history && res.history.length > 0) {
          const loaded = res.history
            .slice()
            .reverse()
            .map(h => ({
              time: h.time || (h.timestamp ? h.timestamp.split(' ')[1] : ''),
              pcs: Number(h.pcs.toFixed(1))
            }));
          setPcsHistory(loaded);
        }
      })
      .catch(err => console.debug('History preload skipped:', err));

    getDetectionMode()
      .then(data => setDetectionModeState(data.mode || 'rule'))
      .catch(err => console.error('Failed to get detection mode:', err));

    fetchPostureData();

    // Polling intervals
    const postureInterval = setInterval(fetchPostureData, 1000);
    const guidanceInterval = setInterval(fetchGuidanceAdvice, 30000);
    fetchGuidanceAdvice();

    const analyticsInterval = setInterval(fetchAnalyticsData, 4000);
    fetchAnalyticsData();

    return () => {
      clearInterval(postureInterval);
      clearInterval(guidanceInterval);
      clearInterval(analyticsInterval);
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Guidance stream animation
  useEffect(() => {
    if (!guidanceAdvice) return;

    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }

    setDisplayedGuidance('');
    setIsTyping(true);
    let charIndex = 0;

    typingIntervalRef.current = setInterval(() => {
      if (charIndex < guidanceAdvice.length) {
        setDisplayedGuidance(guidanceAdvice.substring(0, charIndex + 1));
        charIndex++;
      } else {
        clearInterval(typingIntervalRef.current);
        setIsTyping(false);
      }
    }, 20);

    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, [guidanceAdvice]);

  // Track PCS history for trend visualization
  useEffect(() => {
    if (postureData.pcs !== null && postureData.pcs !== undefined && postureData.last_updated) {
      setPcsHistory(prev => {
        const now = new Date();
        const timeLabel = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const newEntry = { time: timeLabel, pcs: Number(postureData.pcs.toFixed(1)) };
        const updated = [...prev, newEntry];
        return updated.slice(-30);
      });
    }
  }, [postureData.pcs, postureData.last_updated]);

  const fetchPostureData = async () => {
    try {
      const data = await getPostureStatus();

      // Status change toast notifications
      if (previousStatusRef.current && previousStatusRef.current !== data.status) {
        if (data.status === 'Good Posture') {
          toast.success('Good posture alignment detected.', {
            position: 'top-right',
            autoClose: 2500,
          });
          if (soundEnabled) audioManager.playSuccess();
        } else if (data.status === 'Posture Warning') {
          toast.warning('Posture Warning: Alignment adjustment recommended.', {
            position: 'top-right',
            autoClose: 3500,
          });
          if (soundEnabled) audioManager.playWarning();
        } else if (data.status === 'Bad Posture') {
          toast.error('Bad Posture: Please adjust ergonomic positioning.', {
            position: 'top-right',
            autoClose: 4000,
          });
          if (soundEnabled) audioManager.playAlert();
        }
      }

      // Persistent critical alerts
      if (data.alert && !alertShownRef.current) {
        toast.error('Ergonomic Alert: Extended posture deviation detected.', {
          position: 'top-center',
          autoClose: 5000,
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
        toast.error('Telemetry disconnected: backend service unavailable.', {
          position: 'bottom-left',
          autoClose: 4000,
        });
      }
      setIsConnected(false);
      setError('Unable to retrieve posture telemetry. Ensure backend camera service is running.');
    }
  };

  const fetchGuidanceAdvice = async () => {
    try {
      const data = await getLLMAdvice();
      if (data.status === 'success' && data.advice) {
        setGuidanceAdvice(data.advice);
      }
    } catch (err) {
      console.debug('Guidance update skipped:', err);
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      const data = await getAnalytics();
      setAnalyticsData(data);
    } catch (err) {
      console.debug('Analytics fetch skipped:', err);
    }
  };

  const handleModeChange = async (newMode) => {
    if (newMode === detectionMode || modeLoading) return;
    setModeLoading(true);
    try {
      await setDetectionMode(newMode);
      setDetectionModeState(newMode);
      toast.success(`Classification method updated to ${newMode === 'ml' ? 'ML-Based' : 'Rule-Based'}.`, {
        position: 'top-right',
        autoClose: 2500,
      });
    } catch (err) {
      toast.error(err.message || 'Failed to switch classification mode', {
        position: 'top-right',
        autoClose: 3500,
      });
    } finally {
      setModeLoading(false);
    }
  };

  // Semantic Status Helpers
  const getStatusMeta = (status) => {
    switch (status) {
      case 'Good Posture':
        return {
          label: 'Good Posture',
          type: 'good',
          color: 'var(--status-good)',
          bg: 'var(--status-good-bg)',
          border: 'var(--status-good-border)',
          icon: <CheckCircle2 className="status-icon-svg" size={24} />,
          explanation: 'Body alignment is within standard ergonomic thresholds.',
        };
      case 'Posture Warning':
        return {
          label: 'Posture Warning',
          type: 'warning',
          color: 'var(--status-warning)',
          bg: 'var(--status-warning-bg)',
          border: 'var(--status-warning-border)',
          icon: <AlertTriangle className="status-icon-svg" size={24} />,
          explanation: 'Minor posture angle deviation detected (forward head/neck slope).',
        };
      case 'Bad Posture':
        return {
          label: 'Bad Posture',
          type: 'bad',
          color: 'var(--status-bad)',
          bg: 'var(--status-bad-bg)',
          border: 'var(--status-bad-border)',
          icon: <AlertOctagon className="status-icon-svg" size={24} />,
          explanation: 'Significant slouching or spinal deviation detected. Immediate correction required.',
        };
      default:
        return {
          label: status || 'Standby',
          type: 'standby',
          color: 'var(--text-slate)',
          bg: 'var(--surface-subtle)',
          border: 'var(--border-color)',
          icon: <Activity className="status-icon-svg" size={24} />,
          explanation: 'Awaiting posture telemetry stream from computer-vision pipeline.',
        };
    }
  };

  const currentMeta = getStatusMeta(postureData.status);

  // Chart datasets
  const pieData = analyticsData
    ? [
        { name: 'Good Posture', value: analyticsData.good_posture_count || 0, color: '#16A34A' },
        { name: 'Posture Warning', value: analyticsData.warning_count || 0, color: '#F59E0B' },
        { name: 'Bad Posture', value: analyticsData.bad_posture_count || 0, color: '#DC2626' },
      ].filter(d => d.value > 0)
    : [];

  const barData = analyticsData
    ? [
        { name: 'Good', count: analyticsData.good_posture_count || 0, fill: '#16A34A' },
        { name: 'Warning', count: analyticsData.warning_count || 0, fill: '#F59E0B' },
        { name: 'Bad', count: analyticsData.bad_posture_count || 0, fill: '#DC2626' },
      ]
    : [];

  const formatSedentaryMinutes = (seconds) => {
    const mins = Math.floor((seconds || 0) / 60);
    const secs = (seconds || 0) % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        {/* Error Alert Bar */}
        {error && (
          <div className="telemetry-banner error-banner">
            <AlertOctagon size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Active Posture Critical Alert */}
        {postureData.alert && (
          <div className="telemetry-banner posture-alert-banner">
            <AlertTriangle size={18} />
            <span><strong>Critical Posture Alert:</strong> Sustained posture deviation detected. Please sit upright and realign your neck and shoulders.</span>
          </div>
        )}

        {/* Header Bar */}
        <header className="dashboard-header-panel">
          <div className="header-info">
            <div className="header-title-row">
              <h1 className="header-title">Posture Monitoring Console</h1>
              <span className="cv-tag">Computer Vision Telemetry</span>
            </div>
            <p className="header-subtitle">
              Real-time pose estimation and ergonomic posture classification via MediaPipe
            </p>
          </div>

          <div className="header-controls">
            {/* Connection Status Badge */}
            <div className={`telemetry-status-badge ${isConnected ? 'online' : 'offline'}`}>
              <Radio size={14} className={isConnected ? 'pulse-icon' : ''} />
              <span>{isConnected ? 'Stream Active' : 'Disconnected'}</span>
            </div>

            {/* Audio Toggle */}
            <button
              className={`sound-toggle-btn ${soundEnabled ? 'active' : ''}`}
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute audio alerts' : 'Enable audio alerts'}
              aria-label="Toggle Sound Alerts"
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              <span>{soundEnabled ? 'Alerts On' : 'Alerts Muted'}</span>
            </button>
          </div>
        </header>

        {/* Top Control & Pipeline Bar */}
        <section className="pipeline-controls-panel">
          <div className="pipeline-meta">
            <div className="pipeline-meta-item">
              <Cpu size={16} className="meta-icon" />
              <span className="meta-label">CV Pipeline:</span>
              <span className="meta-value">MediaPipe Pose Landmarks</span>
            </div>
            <div className="pipeline-meta-item">
              <RefreshCw size={16} className="meta-icon" />
              <span className="meta-label">Sampling Rate:</span>
              <span className="meta-value">1.0 Hz (Continuous)</span>
            </div>
            {postureData.last_updated && (
              <div className="pipeline-meta-item">
                <Clock size={16} className="meta-icon" />
                <span className="meta-label">Last Packet:</span>
                <span className="meta-value">{postureData.last_updated}</span>
              </div>
            )}
          </div>

          {/* Technical Detection Mode Selector */}
          <div className="detection-mode-toggle-group">
            <span className="toggle-group-label">
              <Sliders size={14} />
              <span>Classification Engine:</span>
            </span>
            <div className="mode-toggle-buttons">
              <button
                type="button"
                className={`mode-btn ${detectionMode === 'rule' ? 'active' : ''}`}
                onClick={() => handleModeChange('rule')}
                disabled={modeLoading}
              >
                <Layers size={14} />
                <span>Rule-Based</span>
              </button>
              <button
                type="button"
                className={`mode-btn ${detectionMode === 'ml' ? 'active' : ''}`}
                onClick={() => handleModeChange('ml')}
                disabled={modeLoading}
              >
                <Cpu size={14} />
                <span>ML-Based</span>
              </button>
            </div>
          </div>
        </section>

        {/* Primary Monitoring Telemetry Cards */}
        <section className="primary-telemetry-grid">
          {/* Current Posture State Card */}
          <div className="telemetry-card primary-status-card" style={{ borderColor: currentMeta.border }}>
            <div className="card-header-row">
              <span className="card-kicker">Current Classification</span>
              <span className={`status-pill ${currentMeta.type}`}>
                {currentMeta.type.toUpperCase()}
              </span>
            </div>
            <div className="status-hero-row">
              <div className="status-icon-wrapper" style={{ backgroundColor: currentMeta.bg, color: currentMeta.color }}>
                {currentMeta.icon}
              </div>
              <div className="status-label-group">
                <h2 className="status-main-label" style={{ color: currentMeta.color }}>
                  {currentMeta.label}
                </h2>
                <p className="status-explanation">{currentMeta.explanation}</p>
              </div>
            </div>
          </div>

          {/* Posture Confidence Score (PCS) Card */}
          <div className="telemetry-card pcs-metric-card">
            <div className="card-header-row">
              <span className="card-kicker">Posture Confidence Score</span>
              <span className="pcs-scale-tag">0 – 100 Index</span>
            </div>
            <div className="pcs-display-row">
              <div className="pcs-large-number">
                {postureData.pcs !== null && postureData.pcs !== undefined ? postureData.pcs.toFixed(2) : '0.00'}
              </div>
              <div className="pcs-status-tag-group">
                <span className="pcs-status-tag" style={{ color: currentMeta.color }}>
                  {postureData.pcs >= 75 ? 'Optimal Posture' : postureData.pcs >= 50 ? 'Suboptimal Alignment' : 'Critical Deviation'}
                </span>
                <span className="pcs-formula-caption">Geometric posture & angle confidence</span>
              </div>
            </div>
            <div className="pcs-progress-track">
              <div
                className="pcs-progress-bar"
                style={{
                  width: `${Math.min(Math.max(postureData.pcs || 0, 0), 100)}%`,
                  backgroundColor: currentMeta.color
                }}
              />
            </div>
          </div>

          {/* Sedentary Duration Card */}
          <div className="telemetry-card sedentary-metric-card">
            <div className="card-header-row">
              <span className="card-kicker">Active Sedentary Duration</span>
              <Clock size={16} className="card-header-icon" />
            </div>
            <div className="sedentary-display-row">
              <div className="sedentary-large-number">
                {formatSedentaryMinutes(postureData.sedentary_time)}
              </div>
              <div className="sedentary-detail-group">
                <span className="sedentary-guidance-badge">
                  {postureData.sedentary_time > 1800 ? 'Break Recommended' : 'Active Session'}
                </span>
                <span className="sedentary-caption">Accumulated continuous sitting</span>
              </div>
            </div>
            <div className="sedentary-threshold-bar">
              <div
                className="sedentary-fill"
                style={{
                  width: `${Math.min(((postureData.sedentary_time || 0) / 1800) * 100, 100)}%`,
                  backgroundColor: postureData.sedentary_time > 1800 ? 'var(--status-warning)' : 'var(--accent-teal)'
                }}
              />
            </div>
          </div>
        </section>

        {/* Visual Analytics Telemetry Row */}
        <section className="analytics-visual-section">
          <div className="section-title-strip">
            <h2 className="section-title">
              <TrendingUp size={18} />
              <span>Real-Time Telemetry & Session Metrics</span>
            </h2>
          </div>

          <div className="charts-telemetry-grid">
            {/* PCS Trend Area Chart */}
            <div className="telemetry-chart-card chart-card-wide">
              <div className="chart-card-header">
                <div>
                  <h3 className="chart-title">PCS Score Trend (Last 30 Telemetry Points)</h3>
                  <p className="chart-subtitle">Real-time fluctuations in calculated posture confidence</p>
                </div>
              </div>
              <div className="chart-container">
                {pcsHistory.length > 1 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={pcsHistory} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="tealPcsGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0E8F9C" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#0E8F9C" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#DCE4E8" vertical={false} />
                      <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#667685' }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#667685' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#17324D',
                          borderColor: '#234768',
                          borderRadius: '8px',
                          color: '#FFFFFF',
                          fontSize: '0.85rem'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="pcs"
                        name="PCS"
                        stroke="#0E8F9C"
                        strokeWidth={2.5}
                        fill="url(#tealPcsGradient)"
                        dot={false}
                        activeDot={{ r: 5, fill: '#0E8F9C' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="chart-placeholder-state">
                    <Activity size={24} className="spinning-placeholder" />
                    <span>Collecting consecutive telemetry data points...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Posture Distribution Donut Chart */}
            <div className="telemetry-chart-card">
              <div className="chart-card-header">
                <div>
                  <h3 className="chart-title">Posture Distribution</h3>
                  <p className="chart-subtitle">Proportion of classification states</p>
                </div>
              </div>
              <div className="chart-container">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="#FFFFFF" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderColor: '#DCE4E8',
                          borderRadius: '8px',
                          color: '#17212B',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        iconType="circle"
                        wrapperStyle={{ fontSize: '0.82rem', paddingTop: '10px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="chart-placeholder-state">
                    <span>Awaiting session distribution data...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Posture Count Breakdown Bar Chart */}
            <div className="telemetry-chart-card">
              <div className="chart-card-header">
                <div>
                  <h3 className="chart-title">Classification Counts</h3>
                  <p className="chart-subtitle">Absolute check tally by category</p>
                </div>
              </div>
              <div className="chart-container">
                {barData.some(d => d.count > 0) ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={barData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#DCE4E8" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#667685' }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#667685' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderColor: '#DCE4E8',
                          borderRadius: '8px',
                          color: '#17212B',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                        }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={45}>
                        {barData.map((entry, index) => (
                          <Cell key={`bar-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="chart-placeholder-state">
                    <span>Awaiting classification count data...</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Metrics KPI Strip */}
          {analyticsData && (
            <div className="metrics-kpi-strip">
              <div className="kpi-block">
                <span className="kpi-value">{analyticsData.total_checks || 0}</span>
                <span className="kpi-label">Total Classified Frames</span>
              </div>
              <div className="kpi-block">
                <span className="kpi-value">{(analyticsData.avg_pcs || 0).toFixed(1)}</span>
                <span className="kpi-label">Mean PCS Score</span>
              </div>
              <div className="kpi-block">
                <span className="kpi-value good-metric">{analyticsData.good_percentage || 0}%</span>
                <span className="kpi-label">Optimal Posture Ratio</span>
              </div>
              <div className="kpi-block">
                <span className="kpi-value">
                  {analyticsData.session_duration ? `${Math.floor(analyticsData.session_duration / 60)}m` : '0m'}
                </span>
                <span className="kpi-label">Session Elapsed Time</span>
              </div>
            </div>
          )}
        </section>

        {/* Posture Correction Guidance Panel (Powered by Groq LLM) */}
        <section className="guidance-section-panel">
          <div className="guidance-card">
            <div className="guidance-header">
              <div className="guidance-title-group">
                <Sparkles size={18} className="guidance-icon" />
                <h3 className="guidance-title">Ergonomic Correction Guidance</h3>
                <span className="groq-model-tag">Groq LLaMA-3.1</span>
              </div>
              {isTyping && <span className="guidance-live-badge">Updating Live...</span>}
            </div>

            {displayedGuidance ? (
              <div className="guidance-body">
                <p className="guidance-text">{displayedGuidance}</p>
              </div>
            ) : (
              <div className="guidance-fallback">
                <p>Analyzing pose landmarks to generate tailored ergonomic alignment recommendations...</p>
              </div>
            )}

            {/* Quick Action Items from Backend */}
            {postureData.recommendations && postureData.recommendations.length > 0 && (
              <div className="recommendations-container">
                <h4 className="recommendations-heading">Identified Correction Steps</h4>
                <div className="recommendations-chips-grid">
                  {postureData.recommendations.map((rec, idx) => (
                    <div key={idx} className="recommendation-chip">
                      <ShieldCheck size={16} className="chip-icon" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Semantic Status Guide Reference */}
        <section className="status-reference-panel">
          <div className="reference-card">
            <h4 className="reference-title">Classification State Reference</h4>
            <div className="reference-items-row">
              <div className="reference-item">
                <span className="reference-indicator good" />
                <div>
                  <strong>Good Posture:</strong> Spinal curvature and neck angles within healthy ergonomic range.
                </div>
              </div>
              <div className="reference-item">
                <span className="reference-indicator warning" />
                <div>
                  <strong>Posture Warning:</strong> Forward head tilt or moderate slouch requiring minor adjustment.
                </div>
              </div>
              <div className="reference-item">
                <span className="reference-indicator bad" />
                <div>
                  <strong>Bad Posture:</strong> Substantial ergonomic misalignment. Correction alert triggered.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Clean Technical Footer */}
        <footer className="dashboard-console-footer">
          <p>VertAIx Computer-Vision Posture Monitoring System • Research & Ergonomic Telemetry Console</p>
        </footer>
      </div>
    </div>
  );
};

export default Dashboard;
