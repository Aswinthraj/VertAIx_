import React, { useState, useEffect } from 'react';
import { getHistory, clearHistory, saveUserDetailsCSV } from '../services/api';
import { toast } from 'react-toastify';
import {
  History as HistoryIcon,
  Download,
  Trash2,
  Save,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  FileSpreadsheet,
  Clock,
  AlertCircle
} from 'lucide-react';
import './History.css';

const History = () => {
  const [historyData, setHistoryData] = useState([]);
  const [stats, setStats] = useState({
    total_records: 0,
    good_posture_count: 0,
    warning_count: 0,
    bad_posture_count: 0,
    alert_count: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingCsv, setSavingCsv] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 2000);
    return () => clearInterval(interval);
  }, []);

  const fetchHistory = async () => {
    try {
      const data = await getHistory(100);
      setHistoryData(data.history || []);
      setStats(data.stats || {
        total_records: 0,
        good_posture_count: 0,
        warning_count: 0,
        bad_posture_count: 0,
        alert_count: 0
      });
      setIsLoading(false);
      setError(null);
    } catch (err) {
      console.error('Error fetching history:', err);
      setError('Unable to retrieve posture telemetry log');
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Good Posture':
        return {
          className: 'badge-good',
          icon: <CheckCircle2 size={13} />,
          label: 'Good Posture'
        };
      case 'Posture Warning':
        return {
          className: 'badge-warning',
          icon: <AlertTriangle size={13} />,
          label: 'Posture Warning'
        };
      case 'Bad Posture':
        return {
          className: 'badge-bad',
          icon: <AlertOctagon size={13} />,
          label: 'Bad Posture'
        };
      default:
        return {
          className: 'badge-unknown',
          icon: <AlertCircle size={13} />,
          label: status || 'Unknown'
        };
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm('Are you sure you want to clear all posture telemetry records?')) {
      setClearing(true);
      try {
        await clearHistory();
        toast.success('Telemetry history cleared.', {
          position: 'top-right',
          autoClose: 2500,
        });
        await fetchHistory();
      } catch (err) {
        toast.error('Failed to clear telemetry history', {
          position: 'top-right',
          autoClose: 3000,
        });
      } finally {
        setClearing(false);
      }
    }
  };

  const exportHistory = () => {
    if (historyData.length === 0) return;
    const csv = [
      ['Timestamp', 'Status', 'PCS', 'Alert', 'Sedentary Time (s)'],
      ...historyData.map(entry => [
        entry.timestamp,
        entry.status,
        entry.pcs,
        entry.alert ? 'Yes' : 'No',
        entry.sedentary_time || 0
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vertaix-telemetry-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Telemetry CSV file exported.', {
      position: 'top-right',
      autoClose: 2500,
    });
  };

  const handleSaveCSV = async () => {
    setSavingCsv(true);
    try {
      const result = await saveUserDetailsCSV();
      toast.success(`Server report generated: ${result.file} (${result.records} records)`, {
        position: 'top-right',
        autoClose: 3500,
      });
    } catch (err) {
      toast.error('Failed to save server CSV report', {
        position: 'top-right',
        autoClose: 3000,
      });
    } finally {
      setSavingCsv(false);
    }
  };

  if (isLoading) {
    return (
      <div className="history-page">
        <div className="history-container">
          <div className="history-loading-card">
            <HistoryIcon className="loading-icon-spin" size={32} />
            <p>Loading posture history telemetry...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="history-page">
      <div className="history-container">
        {/* Error Banner */}
        {error && (
          <div className="history-error-banner">
            <AlertOctagon size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Header Bar */}
        <header className="history-header-card">
          <div className="header-text-group">
            <div className="header-badge-row">
              <h1 className="history-title">Posture Telemetry Log</h1>
              <span className="history-count-badge">{stats.total_records} Recorded Entries</span>
            </div>
            <p className="history-subtitle">
              Chronological log of classified posture evaluations, confidence measurements, and alert triggers
            </p>
          </div>

          {/* Action Bar */}
          <div className="history-actions-group">
            <button
              onClick={handleSaveCSV}
              className="action-btn btn-save"
              disabled={historyData.length === 0 || savingCsv}
              title="Save structured session report to backend server"
            >
              <Save size={15} />
              <span>{savingCsv ? 'Saving...' : 'Save Report'}</span>
            </button>

            <button
              onClick={exportHistory}
              className="action-btn btn-export"
              disabled={historyData.length === 0}
              title="Download client CSV spreadsheet"
            >
              <Download size={15} />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleClearHistory}
              className="action-btn btn-clear"
              disabled={historyData.length === 0 || clearing}
              title="Clear all recorded entries"
            >
              <Trash2 size={15} />
              <span>Clear Log</span>
            </button>
          </div>
        </header>

        {/* Telemetry Summary Stats Strip */}
        <section className="history-stats-grid">
          <div className="history-stat-box">
            <span className="stat-label">Total Logs</span>
            <span className="stat-number">{stats.total_records}</span>
          </div>
          <div className="history-stat-box">
            <span className="stat-label">Good Posture</span>
            <span className="stat-number good">{stats.good_posture_count}</span>
          </div>
          <div className="history-stat-box">
            <span className="stat-label">Warnings</span>
            <span className="stat-number warning">{stats.warning_count}</span>
          </div>
          <div className="history-stat-box">
            <span className="stat-label">Bad Posture</span>
            <span className="stat-number bad">{stats.bad_posture_count}</span>
          </div>
          <div className="history-stat-box">
            <span className="stat-label">Alert Triggers</span>
            <span className="stat-number alert">{stats.alert_count || 0}</span>
          </div>
        </section>

        {/* Telemetry Table Container */}
        <section className="history-table-section">
          {historyData.length === 0 ? (
            <div className="history-empty-card">
              <FileSpreadsheet size={42} className="empty-icon" />
              <h3 className="empty-title">No Telemetry Records Found</h3>
              <p className="empty-desc">
                Posture classification frames will appear in this chronological log as the vision service runs.
              </p>
            </div>
          ) : (
            <div className="table-responsive-wrapper">
              <table className="telemetry-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Classification State</th>
                    <th>Confidence (PCS)</th>
                    <th>Alert Status</th>
                    <th>Sedentary Duration</th>
                    <th>Full Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {historyData.map((entry, idx) => {
                    const badge = getStatusBadge(entry.status);
                    return (
                      <tr key={entry.id || idx}>
                        <td className="time-col">
                          <Clock size={13} className="inline-icon" />
                          <span>{entry.time}</span>
                        </td>
                        <td>
                          <span className={`posture-badge ${badge.className}`}>
                            {badge.icon}
                            <span>{badge.label}</span>
                          </span>
                        </td>
                        <td className="pcs-col">
                          {entry.pcs !== null && entry.pcs !== undefined ? entry.pcs.toFixed(2) : '—'}
                        </td>
                        <td>
                          {entry.alert ? (
                            <span className="alert-badge active">
                              <AlertTriangle size={12} />
                              <span>Active</span>
                            </span>
                          ) : (
                            <span className="alert-badge nominal">Nominal</span>
                          )}
                        </td>
                        <td className="sedentary-col">
                          {entry.sedentary_time ? `${Math.floor(entry.sedentary_time / 60)}m ${entry.sedentary_time % 60}s` : '0s'}
                        </td>
                        <td className="timestamp-col">{entry.timestamp}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default History;
