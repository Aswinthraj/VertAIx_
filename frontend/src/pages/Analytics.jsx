import React, { useState, useEffect } from 'react';
import { getAnalytics, resetAnalytics } from '../services/api';
import { toast } from 'react-toastify';
import './Analytics.css';
import { BarChartOutlined, PieChartOutlined } from '@ant-design/icons';

const Analytics = () => {
  const [stats, setStats] = useState({
    good_posture_count: 0,
    warning_count: 0,
    bad_posture_count: 0,
    total_checks: 0,
    avg_pcs: 0,
    session_duration: 0,
    total_sedentary_time: 0,
    good_percentage: 0,
    warning_percentage: 0,
    bad_percentage: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Temporary userId until Firebase integration
  const userId = 'default_user';

  useEffect(() => {
    // Fetch analytics immediately
    fetchAnalytics();

    // Poll analytics every 2 seconds
    const interval = setInterval(() => {
      fetchAnalytics();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const fetchAnalytics = async () => {
    try {
      const data = await getAnalytics(userId);
      setStats({
        good_posture_count: data.good_posture_count,
        warning_count: data.warning_count,
        bad_posture_count: data.bad_posture_count,
        total_checks: data.total_checks,
        avg_pcs: data.avg_pcs,
        session_duration: data.session_duration,
        total_sedentary_time: data.total_sedentary_time || 0,
        good_percentage: data.good_percentage,
        warning_percentage: data.warning_percentage,
        bad_percentage: data.bad_percentage,
      });
      setIsLoading(false);
      setError(null);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Unable to load analytics data');
      setIsLoading(false);
    }
  };

  const handleResetAnalytics = async () => {
    if (window.confirm('Are you sure you want to reset all analytics data?')) {
      try {
        await resetAnalytics(userId);
        toast.success('Analytics data reset successfully!', {
          position: "top-right",
          autoClose: 3000,
        });
        fetchAnalytics(); // Refresh data
      } catch (err) {
        toast.error('Failed to reset analytics data', {
          position: "top-right",
          autoClose: 3000,
        });
      }
    }
  };

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}h ${mins}m ${secs}s`;
  };

  if (isLoading) {
    return (
      <div className="analytics-page">
        <div className="analytics-header">
          <h1><BarChartOutlined /> Analytics Dashboard</h1>
          <p>Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-page">
        <div className="analytics-header">
          <h1><BarChartOutlined /> Analytics Dashboard</h1>
          <p className="error-text">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <h1><BarChartOutlined /> Analytics Dashboard</h1>
        <p>Real-time posture monitoring statistics and insights</p>
        <button className="reset-button" onClick={handleResetAnalytics}>
          🔄 Reset Analytics
        </button>
      </div>

      <div className="analytics-grid">
        <div className="stat-card">
          <div className="stat-icon good">✓</div>
          <div className="stat-content">
            <h3>Good Posture</h3>
            <div className="stat-value">{stats.good_posture_count}</div>
            <div className="stat-percentage">{stats.good_percentage}%</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon warning">⚠</div>
          <div className="stat-content">
            <h3>Warnings</h3>
            <div className="stat-value">{stats.warning_count}</div>
            <div className="stat-percentage">{stats.warning_percentage}%</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon bad">✕</div>
          <div className="stat-content">
            <h3>Bad Posture</h3>
            <div className="stat-value">{stats.bad_posture_count}</div>
            <div className="stat-percentage">{stats.bad_percentage}%</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon info"><PieChartOutlined /></div>
          <div className="stat-content">
            <h3>Total Checks</h3>
            <div className="stat-value">{stats.total_checks}</div>
            <div className="stat-percentage">Session</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon info">💯</div>
          <div className="stat-content">
            <h3>Average PCS</h3>
            <div className="stat-value">{stats.avg_pcs.toFixed(2)}</div>
            <div className="stat-percentage">Score</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon info">⏱️</div>
          <div className="stat-content">
            <h3>Session Time</h3>
            <div className="stat-value-small">{formatDuration(stats.session_duration)}</div>
            <div className="stat-percentage">Duration</div>
          </div>

        <div className="stat-card">
          <div className="stat-icon info">🪑</div>
          <div className="stat-content">
            <h3>Total Sedentary</h3>
            <div className="stat-value-small">{formatDuration(stats.total_sedentary_time)}</div>
            <div className="stat-percentage">All Sessions</div>
          </div>
        </div>
        </div>
      </div>

      <div className="chart-section">
        <h2>Posture Distribution</h2>
        <div className="chart-container">
          <div className="bar-chart">
            <div className="bar-item">
              <div className="bar-label">Good</div>
              <div className="bar-wrapper">
                <div
                  className="bar-fill good"
                  style={{ width: `${stats.good_percentage}%` }}
                >
                  <span className="bar-value">{stats.good_posture_count}</span>
                </div>
              </div>
            </div>
            <div className="bar-item">
              <div className="bar-label">Warning</div>
              <div className="bar-wrapper">
                <div
                  className="bar-fill warning"
                  style={{ width: `${stats.warning_percentage}%` }}
                >
                  <span className="bar-value">{stats.warning_count}</span>
                </div>
              </div>
            </div>
            <div className="bar-item">
              <div className="bar-label">Bad</div>
              <div className="bar-wrapper">
                <div
                  className="bar-fill bad"
                  style={{ width: `${stats.bad_percentage}%` }}
                >
                  <span className="bar-value">{stats.bad_posture_count}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="insights-section">
        <h2>💡 Insights & Recommendations</h2>
        <div className="insights-grid">
          {stats.good_percentage >= 70 && (
            <div className="insight-card success">
              <strong>Excellent Performance!</strong>
              <p>You're maintaining good posture {stats.good_percentage}% of the time. Keep it up!</p>
            </div>
          )}
          {stats.bad_percentage > 30 && (
            <div className="insight-card danger">
              <strong>Attention Needed</strong>
              <p>High bad posture rate ({stats.bad_percentage}%). Consider adjusting your workspace setup.</p>
            </div>
          )}
          {stats.session_duration > 3600 && (
            <div className="insight-card info">
              <strong>Take a Break</strong>
              <p>You've been working for over an hour. Stand up and stretch!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
