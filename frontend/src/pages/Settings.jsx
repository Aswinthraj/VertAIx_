import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile, changePassword, deleteAccount } from '../services/api';
import { toast } from 'react-toastify';
import {
  User,
  Shield,
  Sliders,
  AlertTriangle,
  Save,
  RotateCcw,
  Volume2,
  ShieldAlert,
  Monitor,
  Clock,
  KeyRound,
  Trash2,
  CheckCircle2,
  AlertOctagon,
  Loader2,
  X
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
  const { user, refreshUserProfile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  // Profile Form State
  const [username, setUsername] = useState(user?.displayName || user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileSaving, setProfileSaving] = useState(false);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Client Preferences State
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  // Account Deletion Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (user) {
      setUsername(user.displayName || user.username || '');
      setEmail(user.email || '');
    }
  }, [user]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('vertaix-settings');
      if (saved) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
      }
    } catch (e) {
      console.warn('Failed to load local preferences:', e);
    }
  }, []);

  const handlePreferenceChange = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleNotificationToggle = async (e) => {
    const checked = e.target.checked;
    if (checked && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        handlePreferenceChange('notificationEnabled', true);
        toast.success('Browser notification permissions granted.');
      } else {
        handlePreferenceChange('notificationEnabled', false);
        toast.warning('Browser notification permissions denied.');
      }
    } else {
      handlePreferenceChange('notificationEnabled', checked);
    }
  };

  const handleSavePreferences = () => {
    try {
      localStorage.setItem('vertaix-settings', JSON.stringify(settings));
      toast.success('Local preferences saved successfully.');
    } catch {
      toast.error('Failed to save preferences.');
    }
  };

  const handleResetPreferences = () => {
    if (window.confirm('Reset client monitoring preferences to default values?')) {
      setSettings(DEFAULT_SETTINGS);
      localStorage.setItem('vertaix-settings', JSON.stringify(DEFAULT_SETTINGS));
      toast.info('Preferences reset to default values.');
    }
  };

  // Profile Update Submit
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      await updateProfile({
        username: username.trim(),
        email: email.trim(),
      });
      await refreshUserProfile();
      toast.success('Profile details updated successfully.');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  // Password Change Submit
  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    setPasswordSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      toast.success('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.message || 'Failed to change password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  // Account Deletion Submit
  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setDeleteError('');

    if (!deletePassword) {
      setDeleteError('Please enter your password to confirm deletion.');
      return;
    }

    setDeleteLoading(true);
    try {
      await deleteAccount(deletePassword);
      toast.info('Account and associated data deleted successfully.');
      setShowDeleteModal(false);
      logout();
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete account. Verify your password.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-container">
        {/* Header */}
        <header className="settings-header-card">
          <div className="header-text-group">
            <div className="header-badge-row">
              <span className="settings-client-badge">Account &amp; System Configuration</span>
            </div>
            <h1 className="settings-title">Settings &amp; Preferences</h1>
            <p className="settings-subtitle">
              Manage your user profile credentials, password security, audio cues, and client telemetry preferences
            </p>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="settings-tabs-bar">
          <button
            className={`settings-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={16} />
            <span>Profile</span>
          </button>
          <button
            className={`settings-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <Shield size={16} />
            <span>Security</span>
          </button>
          <button
            className={`settings-tab-btn ${activeTab === 'preferences' ? 'active' : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            <Sliders size={16} />
            <span>Client Preferences</span>
          </button>
          <button
            className={`settings-tab-btn danger ${activeTab === 'danger' ? 'active' : ''}`}
            onClick={() => setActiveTab('danger')}
          >
            <AlertTriangle size={16} />
            <span>Danger Zone</span>
          </button>
        </div>

        {/* TAB 1: PROFILE */}
        {activeTab === 'profile' && (
          <div className="tab-content-panel">
            <section className="settings-card">
              <div className="settings-section-header">
                <User size={18} className="section-header-icon" />
                <h2 className="settings-section-title">User Profile Details</h2>
              </div>
              <p className="section-desc">
                Update your display name and email address. These details are stored securely in your authenticated account record.
              </p>

              <form className="settings-form" onSubmit={handleUpdateProfile}>
                <div className="profile-readonly-strip">
                  <div className="profile-id-box">
                    <span className="id-label">ACCOUNT ID</span>
                    <strong className="id-value">#{user?.id || user?.uid || '—'}</strong>
                  </div>
                  <div className="profile-id-box">
                    <span className="id-label">STATUS</span>
                    <span className="status-tag active">
                      <CheckCircle2 size={12} />
                      <span>Active Account</span>
                    </span>
                  </div>
                </div>

                <div className="form-field-group">
                  <label htmlFor="prof-username">Display / User Name</label>
                  <input
                    type="text"
                    id="prof-username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    required
                  />
                </div>

                <div className="form-field-group">
                  <label htmlFor="prof-email">Account Email</label>
                  <input
                    type="email"
                    id="prof-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    required
                  />
                </div>

                <div className="form-action-row">
                  <button
                    type="submit"
                    className="btn-primary-action"
                    disabled={profileSaving || !username || !email}
                  >
                    {profileSaving ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Saving Changes...</span>
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        <span>Save Profile</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

        {/* TAB 2: SECURITY */}
        {activeTab === 'security' && (
          <div className="tab-content-panel">
            <section className="settings-card">
              <div className="settings-section-header">
                <KeyRound size={18} className="section-header-icon" />
                <h2 className="settings-section-title">Change Password</h2>
              </div>
              <p className="section-desc">
                Ensure your account is protected with a strong, unique password of at least 8 characters.
              </p>

              <form className="settings-form" onSubmit={handleChangePassword}>
                <div className="form-field-group">
                  <label htmlFor="curr-pass">Current Password</label>
                  <input
                    type="password"
                    id="curr-pass"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    required
                    autoComplete="current-password"
                  />
                </div>

                <div className="form-field-group">
                  <label htmlFor="new-pass">New Password (min. 8 characters)</label>
                  <input
                    type="password"
                    id="new-pass"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                    autoComplete="new-password"
                  />
                </div>

                <div className="form-field-group">
                  <label htmlFor="conf-pass">Confirm New Password</label>
                  <input
                    type="password"
                    id="conf-pass"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    required
                    autoComplete="new-password"
                  />
                </div>

                <div className="form-action-row">
                  <button
                    type="submit"
                    className="btn-primary-action"
                    disabled={passwordSaving || !currentPassword || !newPassword || !confirmPassword}
                  >
                    {passwordSaving ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound size={16} />
                        <span>Update Password</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </section>

            <section className="settings-card">
              <div className="settings-section-header">
                <Shield size={18} className="section-header-icon" />
                <h2 className="settings-section-title">Session Security</h2>
              </div>
              <div className="session-info-box">
                <div className="session-status-row">
                  <div className="status-dot-active" />
                  <span><strong>JWT Authentication Active:</strong> Protected with single-use cryptographic refresh tokens and automatic 401 token rotation.</span>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* TAB 3: CLIENT PREFERENCES */}
        {activeTab === 'preferences' && (
          <div className="tab-content-panel">
            <section className="settings-card">
              <div className="settings-section-header">
                <Volume2 size={18} className="section-header-icon" />
                <h2 className="settings-section-title">Posture Alert Configuration</h2>
              </div>
              <p className="section-desc">
                These settings are stored locally in your browser to personalize feedback cues.
              </p>

              <div className="settings-items-list">
                {/* Audio Alerts */}
                <div className="setting-row">
                  <div className="setting-meta">
                    <div className="setting-label-row">
                      <Volume2 size={16} className="setting-item-icon" />
                      <span className="setting-label">Audible Posture Alerts</span>
                    </div>
                    <p className="setting-description">
                      Plays audio feedback tones upon classification transitions (Good, Warning, Alert).
                    </p>
                  </div>
                  <label className="switch-control">
                    <input
                      type="checkbox"
                      checked={settings.soundEnabled}
                      onChange={(e) => handlePreferenceChange('soundEnabled', e.target.checked)}
                    />
                    <span className="switch-slider" />
                  </label>
                </div>

                {/* Visual Banners */}
                <div className="setting-row">
                  <div className="setting-meta">
                    <div className="setting-label-row">
                      <ShieldAlert size={16} className="setting-item-icon" />
                      <span className="setting-label">Visual Warning Banners</span>
                    </div>
                    <p className="setting-description">
                      Displays on-screen warning banners when bad posture is sustained.
                    </p>
                  </div>
                  <label className="switch-control">
                    <input
                      type="checkbox"
                      checked={settings.alertBannerEnabled}
                      onChange={(e) => handlePreferenceChange('alertBannerEnabled', e.target.checked)}
                    />
                    <span className="switch-slider" />
                  </label>
                </div>

                {/* Browser Notifications */}
                <div className="setting-row">
                  <div className="setting-meta">
                    <div className="setting-label-row">
                      <Monitor size={16} className="setting-item-icon" />
                      <span className="setting-label">Desktop Browser Notifications</span>
                    </div>
                    <p className="setting-description">
                      Sends native OS notifications when the window is minimized during critical alerts.
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

            <section className="settings-card">
              <div className="settings-section-header">
                <Sliders size={18} className="section-header-icon" />
                <h2 className="settings-section-title">Telemetry &amp; Log Buffer Limits</h2>
              </div>

              <div className="settings-items-list">
                <div className="setting-row">
                  <div className="setting-meta">
                    <div className="setting-label-row">
                      <Clock size={16} className="setting-item-icon" />
                      <span className="setting-label">Dashboard Refresh Interval</span>
                    </div>
                    <p className="setting-description">
                      Interval between client HTTP polls to the backend posture telemetry endpoint.
                    </p>
                  </div>
                  <select
                    value={settings.refreshInterval}
                    onChange={(e) => handlePreferenceChange('refreshInterval', parseInt(e.target.value, 10))}
                    className="setting-select-control"
                  >
                    <option value={1}>1.0 second (Real-Time)</option>
                    <option value={2}>2.0 seconds (Standard)</option>
                    <option value={5}>5.0 seconds (Low Bandwidth)</option>
                  </select>
                </div>

                <div className="setting-row">
                  <div className="setting-meta">
                    <div className="setting-label-row">
                      <Clock size={16} className="setting-item-icon" />
                      <span className="setting-label">History Log Buffer Limit</span>
                    </div>
                    <p className="setting-description">
                      Maximum number of recent telemetry entries requested for the tabular log view.
                    </p>
                  </div>
                  <select
                    value={settings.historyLimit}
                    onChange={(e) => handlePreferenceChange('historyLimit', parseInt(e.target.value, 10))}
                    className="setting-select-control"
                  >
                    <option value={50}>50 entries</option>
                    <option value={100}>100 entries (Default)</option>
                    <option value={250}>250 entries</option>
                  </select>
                </div>
              </div>

              <div className="settings-footer-actions">
                <button onClick={handleSavePreferences} className="btn-primary-action">
                  <Save size={16} />
                  <span>Save Preferences</span>
                </button>
                <button onClick={handleResetPreferences} className="btn-secondary-action">
                  <RotateCcw size={16} />
                  <span>Reset to Defaults</span>
                </button>
              </div>
            </section>
          </div>
        )}

        {/* TAB 4: DANGER ZONE */}
        {activeTab === 'danger' && (
          <div className="tab-content-panel">
            <section className="settings-card danger-zone-card">
              <div className="settings-section-header danger">
                <AlertTriangle size={18} className="section-header-icon danger" />
                <h2 className="settings-section-title danger">Delete Workspace Account</h2>
              </div>
              <p className="danger-warning-text">
                Permanently deletes your user profile, active sessions, posture history logs, and computed analytics. This action is irreversible and immediately wipes all associated database records.
              </p>

              <div className="danger-action-box">
                <div className="danger-action-meta">
                  <strong>Permanent Account Deletion</strong>
                  <span>Once confirmed, your account and historical telemetry cannot be recovered.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="btn-danger-action"
                >
                  <Trash2 size={16} />
                  <span>Delete My Account</span>
                </button>
              </div>
            </section>
          </div>
        )}

        {/* DELETE ACCOUNT CONFIRMATION MODAL */}
        {showDeleteModal && (
          <div className="modal-overlay">
            <div className="modal-card danger-modal">
              <div className="modal-header">
                <div className="modal-title-row">
                  <AlertOctagon size={20} className="text-bad" />
                  <h3>Confirm Account Deletion</h3>
                </div>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="modal-close-btn"
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleDeleteAccount} className="modal-form">
                <p className="modal-body-text">
                  Please enter your account password to confirm the permanent deletion of <strong>{user?.email}</strong> and all associated posture records.
                </p>

                {deleteError && (
                  <div className="auth-error-banner">
                    <AlertOctagon size={16} />
                    <span>{deleteError}</span>
                  </div>
                )}

                <div className="form-field-group">
                  <label htmlFor="del-pass">Confirm Password</label>
                  <input
                    type="password"
                    id="del-pass"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Enter password"
                    required
                    autoComplete="current-password"
                  />
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    className="btn-secondary-action"
                    disabled={deleteLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-danger-action"
                    disabled={deleteLoading || !deletePassword}
                  >
                    {deleteLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Deleting Account...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 size={16} />
                        <span>Permanently Delete</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
