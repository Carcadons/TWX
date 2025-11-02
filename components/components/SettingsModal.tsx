"use client";
import { useState } from "react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [theme, setTheme] = useState("light");
  const [notifications, setNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Settings</h2>
          <button className="close-button" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <section className="settings-section">
            <h3>Application Preferences</h3>
            
            <div className="setting-item">
              <div className="setting-info">
                <label htmlFor="theme-select">Theme</label>
                <p className="setting-description">Choose your preferred color scheme</p>
              </div>
              <select 
                id="theme-select"
                value={theme} 
                onChange={(e) => setTheme(e.target.value)}
                className="setting-select"
              >
                <option value="light">Light</option>
                <option value="dark">Dark (Coming Soon)</option>
                <option value="auto">Auto (Coming Soon)</option>
              </select>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label htmlFor="notifications-toggle">Notifications</label>
                <p className="setting-description">Receive updates about inspections and changes</p>
              </div>
              <label className="toggle-switch">
                <input
                  id="notifications-toggle"
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label htmlFor="autosave-toggle">Auto-save</label>
                <p className="setting-description">Automatically save inspection changes</p>
              </div>
              <label className="toggle-switch">
                <input
                  id="autosave-toggle"
                  type="checkbox"
                  checked={autoSave}
                  onChange={(e) => setAutoSave(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </section>

          <section className="settings-section">
            <h3>3D Viewer</h3>
            <p className="section-note">Viewer preferences are managed within the 3D viewer interface</p>
          </section>

          <section className="settings-section">
            <h3>Data & Privacy</h3>
            <p className="section-note">
              All inspection data is securely stored in PostgreSQL database. Your user activity 
              is automatically tracked for audit purposes. All data is encrypted in transit and at rest.
            </p>
          </section>

          <section className="settings-section">
            <h3>Account</h3>
            <p className="section-note">
              Account management is handled through Replit Auth. To update your profile information, 
              please manage your account through your authentication provider (Google, GitHub, etc.).
            </p>
          </section>

          <div className="settings-footer">
            <button className="btn-secondary" onClick={onClose}>Close</button>
            <button className="btn-primary" onClick={onClose}>Save Changes</button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 2000;
          padding: var(--space-lg);
          overflow-y: auto;
        }

        .modal-content {
          background: var(--color-white);
          border-radius: var(--border-radius-lg);
          max-width: 700px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: var(--shadow-xl);
          margin: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-xl);
          border-bottom: var(--border-width) solid var(--color-gray-200);
          position: sticky;
          top: 0;
          background: var(--color-white);
          z-index: 10;
          border-radius: var(--border-radius-lg) var(--border-radius-lg) 0 0;
        }

        .modal-header h2 {
          margin: 0;
          font-size: var(--font-size-2xl);
          color: var(--color-gray-900);
          font-weight: 700;
        }

        .close-button {
          background: none;
          border: none;
          color: var(--color-gray-500);
          cursor: pointer;
          padding: var(--space-sm);
          border-radius: var(--border-radius);
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-button:hover {
          background: var(--color-gray-100);
          color: var(--color-gray-700);
        }

        .modal-body {
          padding: var(--space-xl);
        }

        .settings-section {
          margin-bottom: var(--space-2xl);
          padding-bottom: var(--space-xl);
          border-bottom: var(--border-width) solid var(--color-gray-200);
        }

        .settings-section:last-of-type {
          border-bottom: none;
        }

        .settings-section h3 {
          font-size: var(--font-size-xl);
          color: var(--color-gray-900);
          margin: 0 0 var(--space-lg) 0;
          font-weight: 600;
        }

        .setting-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-lg);
          background: var(--color-gray-50);
          border-radius: var(--border-radius);
          margin-bottom: var(--space-md);
        }

        .setting-item:last-child {
          margin-bottom: 0;
        }

        .setting-info {
          flex: 1;
        }

        .setting-info label {
          display: block;
          font-weight: 600;
          color: var(--color-gray-900);
          margin-bottom: var(--space-xs);
          font-size: var(--font-size-base);
        }

        .setting-description {
          margin: 0;
          font-size: var(--font-size-sm);
          color: var(--color-gray-600);
        }

        .setting-select {
          padding: var(--space-sm) var(--space-md);
          border: var(--border-width) solid var(--color-gray-300);
          border-radius: var(--border-radius);
          font-size: var(--font-size-sm);
          color: var(--color-gray-700);
          background: var(--color-white);
          cursor: pointer;
          min-width: 150px;
        }

        .setting-select:focus {
          outline: none;
          border-color: var(--color-primary);
        }

        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 48px;
          height: 24px;
          margin-left: var(--space-md);
        }

        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: var(--color-gray-300);
          transition: 0.3s;
          border-radius: 24px;
        }

        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: 0.3s;
          border-radius: 50%;
        }

        input:checked + .toggle-slider {
          background-color: var(--color-primary);
        }

        input:checked + .toggle-slider:before {
          transform: translateX(24px);
        }

        .section-note {
          color: var(--color-gray-600);
          line-height: 1.7;
          margin: 0;
          font-size: var(--font-size-sm);
        }

        .settings-footer {
          display: flex;
          justify-content: flex-end;
          gap: var(--space-md);
          margin-top: var(--space-xl);
          padding-top: var(--space-xl);
          border-top: var(--border-width) solid var(--color-gray-200);
        }

        .btn-primary,
        .btn-secondary {
          padding: var(--space-sm) var(--space-lg);
          border-radius: var(--border-radius);
          font-size: var(--font-size-sm);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
          border: none;
        }

        .btn-primary {
          background: var(--color-primary);
          color: var(--color-white);
        }

        .btn-primary:hover {
          background: var(--color-primary-dark);
        }

        .btn-secondary {
          background: var(--color-gray-100);
          color: var(--color-gray-700);
        }

        .btn-secondary:hover {
          background: var(--color-gray-200);
        }

        /* Mobile Styles */
        @media (max-width: 768px) {
          .modal-overlay {
            padding: 0;
          }

          .modal-content {
            max-height: 100vh;
            border-radius: 0;
          }

          .modal-header {
            padding: var(--space-lg);
            border-radius: 0;
          }

          .modal-header h2 {
            font-size: var(--font-size-xl);
          }

          .modal-body {
            padding: var(--space-lg);
          }

          .setting-item {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--space-md);
          }

          .setting-select {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
