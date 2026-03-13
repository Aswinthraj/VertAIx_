import React, { useState, useEffect } from 'react';
import { getHistory, clearHistory, saveUserDetailsCSV } from '../services/api';
import { toast } from 'react-toastify';
import './History.css';
import { FieldTimeOutlined, ExportOutlined, ClearOutlined, SaveOutlined } from '@ant-design/icons';

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

  // Temporary userId until Firebase integration
  const userId = 'default_user';

  useEffect(() => {
    // Fetch history immediately
    fetchHistory();

    // Poll history every 2 seconds
    const interval = setInterval(() => {
      fetchHistory();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const fetchHistory = async () => {
    try {
      const data = await getHistory(userId, 100);
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
      setError('Unable to load history data');
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'Good Posture': { class: 'badge-good', icon: '✓' },
      'Posture Warning': { class: 'badge-warning', icon: '⚠' },
      'Bad Posture': { class: 'badge-bad', icon: '✕' },
    };
    return badges[status] || { class: 'badge-unknown', icon: '?' };
  };

  const handleClearHistory = async () => {
    if (window.confirm('Are you sure you want to clear all history?')) {
      try {
        await clearHistory(userId);
        toast.success('History cleared successfully!', {
          position: "top-right",
          autoClose: 3000,
        });
        fetchHistory(); // Refresh data
      } catch (err) {
        toast.error('Failed to clear history', {
          position: "top-right",
          autoClose: 3000,
        });
      }
    }
  };

  const exportHistory = () => {
    // Create CSV from current history data
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

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vertaix-history-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleSaveCSV = async () => {
    try {
      const result = await saveUserDetailsCSV(userId);
      toast.success(`Report saved: ${result.file} (${result.records} records)`, {
        position: "top-right",
        autoClose: 4000,
      });
    } catch (err) {
      toast.error('Failed to save user details CSV', {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="history-page">
        <div className="history-header">
          <div>
            <h1><FieldTimeOutlined /> Posture History</h1>
            <p>Loading history data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="history-page">
        <div className="history-header">
          <div>
            <h1><FieldTimeOutlined /> Posture History</h1>
            <p className="error-text">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="history-page">
      <div className="history-header">
        <div>
          <h1><FieldTimeOutlined /> Posture History</h1>
          <p>Complete log of your posture monitoring sessions</p>
        </div>
        <div className="history-actions">
          <button onClick={handleSaveCSV} className="btn-save" disabled={historyData.length === 0}>
            <SaveOutlined /> Save Report
          </button>
          <button onClick={exportHistory} className="btn-export" disabled={historyData.length === 0}>
            <ExportOutlined /> Export CSV
          </button>
          <button onClick={handleClearHistory} className="btn-clear" disabled={historyData.length === 0}>
            <ClearOutlined /> Clear History
          </button>
        </div>
      </div>

      <div className="history-stats">
        <div className="stat-box">
          <span className="stat-label">Total Records</span>
          <span className="stat-number">{stats.total_records}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Good Posture</span>
          <span className="stat-number good">
            {stats.good_posture_count}
          </span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Warnings</span>
          <span className="stat-number warning">
            {stats.warning_count}
          </span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Bad Posture</span>
          <span className="stat-number bad">
            {stats.bad_posture_count}
          </span>
        </div>
      </div>

      <div className="history-container">
        {historyData.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <h3>No History Yet</h3>
            <p>Posture data will appear here as it's collected</p>
          </div>
        ) : (
          <div className="history-table-wrapper">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Status</th>
                  <th>PCS</th>
                  <th>Alert</th>
                  <th>Full Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {historyData.map((entry) => {
                  const badge = getStatusBadge(entry.status);
                  return (
                    <tr key={entry.id}>
                      <td className="time-cell">{entry.time}</td>
                      <td>
                        <span className={`status-badge ${badge.class}`}>
                          <span className="badge-icon">{badge.icon}</span>
                          {entry.status}
                        </span>
                      </td>
                      <td className="pcs-cell">{entry.pcs.toFixed(2)}</td>
                      <td>
                        {entry.alert ? (
                          <span className="alert-indicator active">🚨 Active</span>
                        ) : (
                          <span className="alert-indicator">—</span>
                        )}
                      </td>
                      <td className="timestamp-cell">{entry.timestamp}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
