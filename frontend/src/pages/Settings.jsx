import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import {
  Bell,
  Volume2,
  Monitor,
  Clock,
  Save,
  RotateCcw,
  User,
  ShieldAlert,
  Sliders
} from 'lucide-react';
import './Settings.css';

const DEFAULT_SETTINGS = {
  soundEnabled: true,
  alertBannerEnabled: true,
  notificationEnabled: false,
  refreshInterval: 1,
  historyLimit: 100,
};

const Settings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('vertaix-settings');
      if (saved) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
      }
    } catch (e) {
      console.warn('Failed to load local settings:', e);
    }
  }, []);

  const handleChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleNotificationToggle = async (e) => {
    const checked = e.target.checked;
    if (checked && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        handleChange('notificationEnabled', true);
        toast.success('Browser notification permissions granted.', { position: 'top-right' });
      } else {
        handleChange('notificationEnabled', false);
        toast.warning('Browser notification permissions were denied.', { position: 'top-right' });
      }
    } else {
      handleChange('notificationEnabled', checked);
    }
  };

  const handleSave = () => {
    try {
      localStorage.setItem('vertaix-settings', JSON.stringify(settings));
      toast.success('Preferences saved successfully.', {
        position: 'top-center',
        autoClose: 2500,
      });
    } catch (e) {
      toast.error('Failed to save settings locally.', { position: 'top-center' });
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset all client monitoring preferences to defaults?')) {
      setSettings(DEFAULT_SETTINGS);
      localStorage.setItem('vertaix-settings', JSON.stringify(DEFAULT_SETTINGS));
      toast.info('Preferences reset to default values.', {
        position: 'top-center',
        autoClose: 2500,
      });
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-container">
        {/* Header */}
        <header className="settings-header-card">
          <div className="header-text-group">
            <div className="header-badge-row">
              <h1 className="settings-title">Monitoring Preferences</h1>
              <span className="settings-client-badge">Client-Side Preferences</span>
            </div>
            <p className="settings-subtitle">
              Configure alert behaviors, dashboard polling frequencies, and local telemetry parameters
            </p>
          </div>
        </header>

        {/* User Session Profile Strip */}
        <section className="settings-card user-profile-card">
          <div className="settings-section-header">
            <User size={18} className="section-header-icon" />
            <h2 className="settings-section-title">Active Monitoring Profile</h2>
          </div>
          <div className="profile-info-grid">
            <div className="profile-info-item">
              <span className="profile-info-label">Account Identifier:</span>
              <span className="profile-info-val">{user?.email || 'Demo Workspace User'}</span>
            </div>
            <div className="profile-info-item">
              <span className="profile-info-label">User UID:</span>
              <span className="profile-info-val monospace">{user?.uid || 'default_user'}</span>
            </div>
          </div>
        </section>

        {/* Alert Notifications Group */}
        <section className="settings-card">
          <div className="settings-section-header">
            <Bell size={18} className="section-header-icon" />
            <h2 className="settings-section-title">Posture Alert Configuration</h2>
          </div>

          <div className="settings-items-list">
            {/* Audio Alerts */}
            <div className="setting-row">
              <div className="setting-meta">
                <div className="setting-label-row">
                  <Volume2 size={16} className="setting-item-icon" />
                  <span className="setting-label">Audible Posture Alerts</span>
                </div>
                <p className="setting-description">
                  Plays distinctive audio feedback tones upon classification transitions (Good, Warning, Alert).
                </p>
              </div>
              <label className="switch-control">
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={(e) => handleChange('soundEnabled', e.target.checked)}
                />
                <span className="switch-slider" />
              </label>
            </div>

            {/* Visual Critical Alerts */}
            <div className="setting-row">
              <div className="setting-meta">
                <div className="setting-label-row">
                  <ShieldAlert size={16} className="setting-item-icon" />
                  <span className="setting-label">Visual Warning Banners</span>
                </div>
                <p className="setting-description">
                  Displays prominent on-screen warning banners when bad posture is sustained.
                </p>
              </div>
              <label className="switch-control">
                <input
                  type="checkbox"
                  checked={settings.alertBannerEnabled}
                  onChange={(e) => handleChange('alertBannerEnabled', e.target.checked)}
                />
                <span className="switch-slider" />
              </label>
            </div>

            {/* Browser System Notifications */}
            <div className="setting-row">
              <div className="setting-meta">
                <div className="setting-label-row">
                  <Monitor size={16} className="setting-item-icon" />
                  <span className="setting-label">Desktop Browser Notifications</span>
                </div>
                <p className="setting-description">
                  Sends native OS notifications when the application window is minimized during critical posture alerts.
                </p>
              </div>
              <label className="switch-control">
                <input
                  type="checkbox"
                  checked={settings.notificationEnabled}
                  onChange={handleNotificationToggle}
                />
                <span className="switch-slider" />
              </label>
            </div>
          </div>
        </section>

        {/* Telemetry Polling & Performance */}
        <section className="settings-card">
          <div className="settings-section-header">
            <Sliders size={18} className="section-header-icon" />
            <h2 className="settings-section-title">Telemetry & Polling Frequency</h2>
          </div>

          <div className="settings-items-list">
            {/* Polling Interval */}
            <div className="setting-row">
              <div className="setting-meta">
                <div className="setting-label-row">
                  <Clock size={16} className="setting-item-icon" />
                  <span className="setting-label">Dashboard Refresh Frequency</span>
                </div>
                <p className="setting-description">
                  Interval between client HTTP polls to the backend posture telemetry endpoint.
                </p>
              </div>
              <div className="setting-control-wrapper">
                <select
                  value={settings.refreshInterval}
                  onChange={(e) => handleChange('refreshInterval', parseInt(e.target.value, 10))}
                  className="setting-select-control"
                >
                  <option value={1}>1.0 second (Real-Time)</option>
                  <option value={2}>2.0 seconds (Standard)</option>
                  <option value={5}>5.0 seconds (Low Bandwidth)</option>
                </select>
              </div>
            </div>

            {/* History Limit */}
            <div className="setting-row">
              <div className="setting-meta">
                <div className="setting-label-row">
                  <Clock size={16} className="setting-item-icon" />
                  <span className="setting-label">History Log Buffer Size</span>
                </div>
                <p className="setting-description">
                  Maximum number of recent telemetry entries requested for the tabular log view.
                </p>
              </div>
              <div className="setting-control-wrapper">
                <select
                  value={settings.historyLimit}
                  onChange={(e) => handleChange('historyLimit', parseInt(e.target.value, 10))}
                  className="setting-select-control"
                >
                  <option value={50}>50 entries</option>
                  <option value={100}>100 entries (Default)</option>
                  <option value={250}>250 entries</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="settings-footer-actions">
          <button onClick={handleSave} className="btn-primary-action">
            <Save size={16} />
            <span>Save Preferences</span>
          </button>
          <button onClick={handleReset} className="btn-secondary-action">
            <RotateCcw size={16} />
            <span>Reset to Defaults</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
