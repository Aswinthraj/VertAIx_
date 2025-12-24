import React, { useState } from 'react';
import { toast } from 'react-toastify';
import './Settings.css';
import { BellTwoTone,SettingFilled  } from '@ant-design/icons';
const Settings = () => {
  const [settings, setSettings] = useState({
    alertEnabled: true,
    soundEnabled: true,
    notificationEnabled: true,
    refreshInterval: 1,
    badPostureThreshold: 3,
    darkMode: false,
    language: 'en',
  });

  const handleChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    toast.success(`${key.replace(/([A-Z])/g, ' $1').trim()} updated!`, {
      position: "bottom-right",
      autoClose: 2000,
    });
  };

  const handleSave = () => {
    localStorage.setItem('vertaix-settings', JSON.stringify(settings));
    toast.success('Settings saved successfully!', {
      position: "top-center",
      autoClose: 3000,
    });
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all settings to default?')) {
      const defaultSettings = {
        alertEnabled: true,
        soundEnabled: true,
        notificationEnabled: true,
        refreshInterval: 1,
        badPostureThreshold: 3,
        darkMode: false,
        language: 'en',
      };
      setSettings(defaultSettings);
      localStorage.setItem('vertaix-settings', JSON.stringify(defaultSettings));
      toast.info('Settings reset to default', {
        position: "top-center",
        autoClose: 3000,
      });
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1><SettingFilled /> Settings</h1>
        <p>Customize your VertAIx experience</p>
      </div>

      <div className="settings-container">
        <div className="settings-section">
          <h2> <BellTwoTone /> Alert Settings</h2>
          <div className="settings-grid">
            <div className="setting-item">
              <div className="setting-info">
                <label>Enable Alerts</label>
                <span className="setting-description">Show alert banners for bad posture</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.alertEnabled}
                  onChange={(e) => handleChange('alertEnabled', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label>Sound Alerts</label>
                <span className="setting-description">Play sound when bad posture detected</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={(e) => handleChange('soundEnabled', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label>Browser Notifications</label>
                <span className="setting-description">Send desktop notifications</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.notificationEnabled}
                  onChange={(e) => handleChange('notificationEnabled', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h2>⏱️ Monitoring Settings</h2>
          <div className="settings-grid">
            <div className="setting-item">
              <div className="setting-info">
                <label>Refresh Interval (seconds)</label>
                <span className="setting-description">How often to check posture</span>
              </div>
              <select
                value={settings.refreshInterval}
                onChange={(e) => handleChange('refreshInterval', parseInt(e.target.value))}
                className="setting-select"
              >
                <option value={1}>1 second</option>
                <option value={2}>2 seconds</option>
                <option value={5}>5 seconds</option>
                <option value={10}>10 seconds</option>
              </select>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label>Bad Posture Threshold</label>
                <span className="setting-description">Consecutive bad readings before alert</span>
              </div>
              <input
                type="number"
                min="1"
                max="10"
                value={settings.badPostureThreshold}
                onChange={(e) => handleChange('badPostureThreshold', parseInt(e.target.value))}
                className="setting-input"
              />
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h2>🎨 Appearance</h2>
          <div className="settings-grid">
            <div className="setting-item">
              <div className="setting-info">
                <label>Dark Mode</label>
                <span className="setting-description">Enable dark theme (Coming soon)</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.darkMode}
                  onChange={(e) => handleChange('darkMode', e.target.checked)}
                  disabled
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label>Language</label>
                <span className="setting-description">Select your preferred language</span>
              </div>
              <select
                value={settings.language}
                onChange={(e) => handleChange('language', e.target.value)}
                className="setting-select"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
              </select>
            </div>
          </div>
        </div>

        <div className="settings-actions">
          <button onClick={handleSave} className="btn-save">
            💾 Save 
          </button>
          <button onClick={handleReset} className="btn-reset">
            🔄 Reset 
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
