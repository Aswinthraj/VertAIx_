import React, { useState, useEffect } from 'react';
import { getAnalytics, resetAnalytics } from '../services/api';
import { toast } from 'react-toastify';
import {
  BarChart2,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Layers,
  Award,
  Clock,
  RotateCcw,
  ShieldCheck,
  Info
} from 'lucide-react';
import './Analytics.css';

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
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 2000);
    return () => clearInterval(interval);
  }, []);

  const fetchAnalytics = async () => {
    try {
      const data = await getAnalytics();
      setStats({
        good_posture_count: data.good_posture_count || 0,
        warning_count: data.warning_count || 0,
        bad_posture_count: data.bad_posture_count || 0,
        total_checks: data.total_checks || 0,
        avg_pcs: data.avg_pcs || 0,
        session_duration: data.session_duration || 0,
        total_sedentary_time: data.total_sedentary_time || 0,
        good_percentage: data.good_percentage || 0,
        warning_percentage: data.warning_percentage || 0,
        bad_percentage: data.bad_percentage || 0,
      });
      setIsLoading(false);
      setError(null);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Unable to retrieve posture analytics data');
      setIsLoading(false);
    }
  };

  const handleResetAnalytics = async () => {
    if (window.confirm('Are you sure you want to reset all session analytics?')) {
      setResetting(true);
      try {
        await resetAnalytics();
        toast.success('Session analytics reset successfully.', {
          position: 'top-right',
          autoClose: 2500,
        });
        await fetchAnalytics();
      } catch (err) {
        toast.error('Failed to reset analytics data', {
          position: 'top-right',
          autoClose: 3000,
        });
      } finally {
        setResetting(false);
      }
    }
  };

  const formatDuration = (seconds) => {
    const sec = Math.max(0, seconds || 0);
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const remainingSecs = sec % 60;
    if (hrs > 0) return `${hrs}h ${mins}m ${remainingSecs}s`;
    return `${mins}m ${remainingSecs}s`;
  };

  if (isLoading) {
    return (
      <div className="analytics-page">
        <div className="analytics-container">
          <div className="analytics-loading-card">
            <BarChart2 className="loading-icon-spin" size={32} />
            <p>Loading posture telemetry analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <div className="analytics-container">
        {/* Error Banner */}
        {error && (
          <div className="analytics-error-banner">
            <AlertOctagon size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Header Bar */}
        <header className="analytics-header-card">
          <div className="header-text-group">
            <div className="header-badge-row">
              <h1 className="analytics-title">Posture Telemetry Analytics</h1>
              <span className="analytics-scope-badge">Session Analysis</span>
            </div>
            <p className="analytics-subtitle">
              Aggregated classification counts, confidence trends, and sedentary duration metrics
            </p>
          </div>

          <button
            className="analytics-reset-btn"
            onClick={handleResetAnalytics}
            disabled={resetting || stats.total_checks === 0}
            title="Reset telemetry counters for this session"
          >
            <RotateCcw size={15} />
            <span>{resetting ? 'Resetting...' : 'Reset Session Analytics'}</span>
          </button>
        </header>

        {/* Primary Classification KPIs */}
        <section className="analytics-kpi-grid">
          {/* Good Posture */}
          <div className="stat-card good-stat">
            <div className="stat-card-top">
              <span className="stat-card-kicker">Optimal Alignment</span>
              <div className="stat-badge good">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <div className="stat-card-main">
              <div className="stat-primary-val">{stats.good_posture_count}</div>
              <div className="stat-ratio-val good">{stats.good_percentage}%</div>
            </div>
            <span className="stat-card-desc">Good Posture checks</span>
          </div>

          {/* Posture Warning */}
          <div className="stat-card warning-stat">
            <div className="stat-card-top">
              <span className="stat-card-kicker">Minor Deviations</span>
              <div className="stat-badge warning">
                <AlertTriangle size={16} />
              </div>
            </div>
            <div className="stat-card-main">
              <div className="stat-primary-val">{stats.warning_count}</div>
              <div className="stat-ratio-val warning">{stats.warning_percentage}%</div>
            </div>
            <span className="stat-card-desc">Posture Warnings</span>
          </div>

          {/* Bad Posture */}
          <div className="stat-card bad-stat">
            <div className="stat-card-top">
              <span className="stat-card-kicker">Critical Misalignments</span>
              <div className="stat-badge bad">
                <AlertOctagon size={16} />
              </div>
            </div>
            <div className="stat-card-main">
              <div className="stat-primary-val">{stats.bad_posture_count}</div>
              <div className="stat-ratio-val bad">{stats.bad_percentage}%</div>
            </div>
            <span className="stat-card-desc">Bad Posture events</span>
          </div>

          {/* Total Checks */}
          <div className="stat-card neutral-stat">
            <div className="stat-card-top">
              <span className="stat-card-kicker">Total Samples</span>
              <div className="stat-badge neutral">
                <Layers size={16} />
              </div>
            </div>
            <div className="stat-card-main">
              <div className="stat-primary-val">{stats.total_checks}</div>
              <div className="stat-ratio-val neutral">Frames</div>
            </div>
            <span className="stat-card-desc">Classified evaluations</span>
          </div>

          {/* Average PCS */}
          <div className="stat-card neutral-stat">
            <div className="stat-card-top">
              <span className="stat-card-kicker">Mean Confidence</span>
              <div className="stat-badge neutral">
                <Award size={16} />
              </div>
            </div>
            <div className="stat-card-main">
              <div className="stat-primary-val">{stats.avg_pcs.toFixed(2)}</div>
              <div className="stat-ratio-val neutral">/ 100</div>
            </div>
            <span className="stat-card-desc">Average PCS Score</span>
          </div>

          {/* Active Session Time */}
          <div className="stat-card neutral-stat">
            <div className="stat-card-top">
              <span className="stat-card-kicker">Active Duration</span>
              <div className="stat-badge neutral">
                <Clock size={16} />
              </div>
            </div>
            <div className="stat-card-main">
              <div className="stat-primary-val compact-font">{formatDuration(stats.session_duration)}</div>
              <div className="stat-ratio-val neutral">Current</div>
            </div>
            <span className="stat-card-desc">Session elapsed</span>
          </div>

          {/* Total Sedentary Time */}
          <div className="stat-card neutral-stat">
            <div className="stat-card-top">
              <span className="stat-card-kicker">Total Sedentary</span>
              <div className="stat-badge neutral">
                <Clock size={16} />
              </div>
            </div>
            <div className="stat-card-main">
              <div className="stat-primary-val compact-font">{formatDuration(stats.total_sedentary_time)}</div>
              <div className="stat-ratio-val neutral">Cumulative</div>
            </div>
            <span className="stat-card-desc">All sessions recorded</span>
          </div>
        </section>

        {/* Posture Distribution Progress Bars */}
        <section className="distribution-section-card">
          <div className="section-header-row">
            <h2 className="section-card-title">Posture Distribution Breakdown</h2>
            <span className="section-meta-text">{stats.total_checks} Total Telemetry Samples</span>
          </div>

          <div className="distribution-bars-container">
            {/* Good Posture Bar */}
            <div className="distribution-bar-row">
              <div className="bar-label-group">
                <span className="bar-name">Good Posture</span>
                <span className="bar-count-tag good">{stats.good_posture_count} ({stats.good_percentage}%)</span>
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill good-fill"
                  style={{ width: `${Math.min(Math.max(stats.good_percentage, 0), 100)}%` }}
                />
              </div>
            </div>

            {/* Posture Warning Bar */}
            <div className="distribution-bar-row">
              <div className="bar-label-group">
                <span className="bar-name">Posture Warning</span>
                <span className="bar-count-tag warning">{stats.warning_count} ({stats.warning_percentage}%)</span>
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill warning-fill"
                  style={{ width: `${Math.min(Math.max(stats.warning_percentage, 0), 100)}%` }}
                />
              </div>
            </div>

            {/* Bad Posture Bar */}
            <div className="distribution-bar-row">
              <div className="bar-label-group">
                <span className="bar-name">Bad Posture</span>
                <span className="bar-count-tag bad">{stats.bad_posture_count} ({stats.bad_percentage}%)</span>
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill bad-fill"
                  style={{ width: `${Math.min(Math.max(stats.bad_percentage, 0), 100)}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Ergonomic Posture Insights */}
        <section className="insights-section-card">
          <div className="section-header-row">
            <h2 className="section-card-title">Session Observations & Analysis</h2>
          </div>

          <div className="insights-container">
            {stats.total_checks === 0 ? (
              <div className="insight-entry neutral">
                <Info size={18} className="insight-icon" />
                <div className="insight-text">
                  <strong>Awaiting Telemetry Data</strong>
                  <p>Telemetry data is collected in real-time as the computer vision loop evaluates webcam frames.</p>
                </div>
              </div>
            ) : (
              <>
                {stats.good_percentage >= 70 && (
                  <div className="insight-entry success">
                    <ShieldCheck size={18} className="insight-icon" />
                    <div className="insight-text">
                      <strong>High Ergonomic Compliance ({stats.good_percentage}%)</strong>
                      <p>Consistent upright posture maintained over the majority of active monitoring time.</p>
                    </div>
                  </div>
                )}

                {stats.bad_percentage > 25 && (
                  <div className="insight-entry danger">
                    <AlertOctagon size={18} className="insight-icon" />
                    <div className="insight-text">
                      <strong>Elevated Slouch / Text-Neck Frequency ({stats.bad_percentage}%)</strong>
                      <p>Frequent deviations detected. Consider raising your monitor height to eye level and relaxing shoulder muscles.</p>
                    </div>
                  </div>
                )}

                {stats.warning_percentage >= 30 && (
                  <div className="insight-entry warning">
                    <AlertTriangle size={18} className="insight-icon" />
                    <div className="insight-text">
                      <strong>Moderate Postural Drift Detected ({stats.warning_percentage}%)</strong>
                      <p>Occasional forward leaning observed. Check backrest contact and lumbar support positioning.</p>
                    </div>
                  </div>
                )}

                {stats.session_duration > 3600 && (
                  <div className="insight-entry info">
                    <Clock size={18} className="insight-icon" />
                    <div className="insight-text">
                      <strong>Sedentary Duration Limit Reached ({Math.floor(stats.session_duration / 60)} min)</strong>
                      <p>Continuous sitting exceeding 60 minutes. A 2-3 minute standing break or gentle stretch is strongly recommended.</p>
                    </div>
                  </div>
                )}

                {stats.good_percentage < 70 && stats.bad_percentage <= 25 && stats.warning_percentage < 30 && stats.session_duration <= 3600 && (
                  <div className="insight-entry neutral">
                    <Info size={18} className="insight-icon" />
                    <div className="insight-text">
                      <strong>Standard Session Progression</strong>
                      <p>Postural alignment metrics are being tracked. Adjust chair height and maintain 90-degree elbow angles for optimal posture.</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Analytics;
