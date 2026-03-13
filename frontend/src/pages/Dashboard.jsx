import React, { useState, useEffect, useRef } from 'react';
import { getPostureStatus, getLLMAdvice, startSession, endSession, getAnalytics, setDetectionMode, getDetectionMode } from '../services/api';
import { toast } from 'react-toastify';
import { audioManager } from '../utils/audioManager';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  RadialBarChart, RadialBar,
  AreaChart, Area,
} from 'recharts';
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
  const [detectionMode, setDetectionModeState] = useState('rule');
  const [modeLoading, setModeLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [pcsHistory, setPcsHistory] = useState([]);
  const previousStatusRef = useRef('');
  const alertShownRef = useRef(false);
  const typingIntervalRef = useRef(null);

  // Temporary userId until Firebase integration
  const userId = 'default_user';

  useEffect(() => {
    // Start session when component mounts
    startSession(userId).catch(err => {
      console.error('Failed to start session:', err);
    });

    // Fetch current detection mode on mount
    getDetectionMode()
      .then(data => setDetectionModeState(data.mode || 'rule'))
      .catch(err => console.error('Failed to get detection mode:', err));

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

    // Fetch analytics data every 5 seconds
    fetchAnalyticsData();
    const analyticsInterval = setInterval(() => {
      fetchAnalyticsData();
    }, 5000);

    // Cleanup intervals on component unmount and end session
    return () => {
      clearInterval(interval);
      clearInterval(llmInterval);
      clearInterval(analyticsInterval);
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
      // End session when leaving dashboard
      endSession(userId).catch(err => {
        console.error('Failed to end session:', err);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const fetchAnalyticsData = async () => {
    try {
      const data = await getAnalytics(userId);
      setAnalyticsData(data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    }
  };

  // Track PCS over time for the area chart
  useEffect(() => {
    if (postureData.pcs !== null && postureData.pcs !== undefined) {
      setPcsHistory(prev => {
        const now = new Date();
        const timeLabel = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const newEntry = { time: timeLabel, pcs: Number(postureData.pcs.toFixed(1)) };
        const updated = [...prev, newEntry];
        // Keep last 30 data points
        return updated.slice(-30);
      });
    }
  }, [postureData.pcs]);

  // Chart color palette
  const CHART_COLORS = {
    good: '#4caf50',
    warning: '#ff9800',
    bad: '#f44336',
    accent: '#667eea',
    purple: '#764ba2',
  };

  // Prepare pie chart data from analytics
  const getPieData = () => {
    if (!analyticsData) return [];
    return [
      { name: 'Good', value: analyticsData.good_posture_count || 0 },
      { name: 'Warning', value: analyticsData.warning_count || 0 },
      { name: 'Bad', value: analyticsData.bad_posture_count || 0 },
    ].filter(d => d.value > 0);
  };

  // Prepare bar chart data from analytics
  const getBarData = () => {
    if (!analyticsData) return [];
    return [
      { name: 'Good', count: analyticsData.good_posture_count || 0, fill: CHART_COLORS.good },
      { name: 'Warning', count: analyticsData.warning_count || 0, fill: CHART_COLORS.warning },
      { name: 'Bad', count: analyticsData.bad_posture_count || 0, fill: CHART_COLORS.bad },
    ];
  };

  // Prepare radial gauge for PCS
  const getGaugeData = () => {
    const pcs = postureData.pcs || 0;
    return [{ name: 'PCS', value: pcs, fill: getStatusColor(postureData.status) }];
  };

  // Custom tooltip for pie chart
  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-custom-tooltip">
          <p><strong>{payload[0].name}</strong></p>
          <p>{payload[0].value} checks ({((payload[0].value / (analyticsData?.total_checks || 1)) * 100).toFixed(1)}%)</p>
        </div>
      );
    }
    return null;
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
          <div className="hero-controls">
            <div className={`connection-badge ${isConnected ? 'connected' : 'disconnected'}`}>
              <span className="status-dot"></span>
              {isConnected ? 'Live Monitoring' : 'Disconnected'}
            </div>
            <div className="mode-selector">
              <label htmlFor="detection-mode">Detection Mode:</label>
              <select
                id="detection-mode"
                value={detectionMode}
                disabled={modeLoading}
                onChange={async (e) => {
                  const newMode = e.target.value;
                  setModeLoading(true);
                  try {
                    await setDetectionMode(newMode);
                    setDetectionModeState(newMode);
                    toast.success(`Switched to ${newMode === 'ml' ? 'ML-Based' : 'Rule-Based'} detection`, {
                      position: 'top-right',
                      autoClose: 3000,
                    });
                  } catch (err) {
                    toast.error(err.message || 'Failed to switch detection mode', {
                      position: 'top-right',
                      autoClose: 4000,
                    });
                  } finally {
                    setModeLoading(false);
                  }
                }}
              >
                <option value="rule">Rule-Based</option>
                <option value="ml">ML-Based</option>
              </select>
              <span className={`mode-badge ${detectionMode === 'ml' ? 'mode-ml' : 'mode-rule'}`}>
                {detectionMode === 'ml' ? '🤖 ML' : '📏 Rule'}
              </span>
            </div>
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

        {/* ── Visual Charts Section ── */}
        <div className="charts-section">
          <h2 className="section-title">📊 Live Visual Analytics</h2>

          <div className="charts-grid">
            {/* Pie Chart – Posture Distribution */}
            <div className="card chart-card">
              <h2>Posture Distribution</h2>
              {getPieData().length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={getPieData()}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="value"
                      animationBegin={0}
                      animationDuration={800}
                    >
                      {getPieData().map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={[CHART_COLORS.good, CHART_COLORS.warning, CHART_COLORS.bad][index]}
                          stroke="none"
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      wrapperStyle={{ fontSize: '0.9rem' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="chart-placeholder">Collecting data...</div>
              )}
            </div>

            {/* Bar Chart – Posture Count Comparison */}
            <div className="card chart-card">
              <h2>Posture Count Breakdown</h2>
              {getBarData().some(d => d.count > 0) ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={getBarData()} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="name" tick={{ fontSize: 13, fill: '#666' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 13, fill: '#666' }} />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.15)' }}
                    />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]} animationDuration={800}>
                      {getBarData().map((entry, index) => (
                        <Cell key={`bar-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="chart-placeholder">Collecting data...</div>
              )}
            </div>

            {/* Radial Gauge – PCS Score */}
            <div className="card chart-card">
              <h2>PCS Confidence Gauge</h2>
              <ResponsiveContainer width="100%" height={280}>
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="90%"
                  startAngle={180}
                  endAngle={0}
                  barSize={18}
                  data={getGaugeData()}
                >
                  <RadialBar
                    background={{ fill: '#e8e8e8' }}
                    dataKey="value"
                    cornerRadius={10}
                    animationDuration={800}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="gauge-label">
                <span className="gauge-value" style={{ color: getStatusColor(postureData.status) }}>
                  {postureData.pcs !== null ? postureData.pcs.toFixed(1) : '–'}
                </span>
                <span className="gauge-caption">/ 100</span>
              </div>
            </div>

            {/* Area Chart – PCS Over Time */}
            <div className="card chart-card chart-card-wide">
              <h2>PCS Score Trend</h2>
              {pcsHistory.length > 1 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={pcsHistory} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="pcsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.accent} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={CHART_COLORS.accent} stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 11, fill: '#999' }}
                      interval="preserveStartEnd"
                    />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#999' }} />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.15)' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="pcs"
                      stroke={CHART_COLORS.accent}
                      strokeWidth={2.5}
                      fill="url(#pcsGradient)"
                      animationDuration={500}
                      dot={false}
                      activeDot={{ r: 5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="chart-placeholder">Waiting for data points...</div>
              )}
            </div>
          </div>

          {/* Quick Stats Row */}
          {analyticsData && (
            <div className="quick-stats-row">
              <div className="quick-stat">
                <span className="quick-stat-value">{analyticsData.total_checks || 0}</span>
                <span className="quick-stat-label">Total Checks</span>
              </div>
              <div className="quick-stat">
                <span className="quick-stat-value">{(analyticsData.avg_pcs || 0).toFixed(1)}</span>
                <span className="quick-stat-label">Avg PCS</span>
              </div>
              <div className="quick-stat">
                <span className="quick-stat-value">{analyticsData.good_percentage || 0}%</span>
                <span className="quick-stat-label">Good Posture</span>
              </div>
              <div className="quick-stat">
                <span className="quick-stat-value">
                  {analyticsData.session_duration
                    ? `${Math.floor(analyticsData.session_duration / 60)}m`
                    : '0m'}
                </span>
                <span className="quick-stat-label">Session Time</span>
              </div>
            </div>
          )}
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
