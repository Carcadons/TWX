"use client";
import { useEffect, useState } from "react";

interface ChangeDetail {
  id: string;
  version: string;
  date: string;
  title: string;
  category: "feature" | "fix" | "enhancement" | "security";
  description: string;
  details: string[];
}

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangelogModal({ isOpen, onClose }: ChangelogModalProps) {
  const [changes, setChanges] = useState<ChangeDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadChangelog();
    }
  }, [isOpen]);

  const loadChangelog = async () => {
    try {
      const response = await fetch('/api/changelog');
      const data = await response.json();
      if (data.success) {
        // Reverse the array to show newest changes first
        setChanges([...data.changes].reverse());
      }
    } catch (error) {
      console.error('Failed to load changelog:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'feature':
        return 'var(--color-primary)';
      case 'enhancement':
        return 'var(--color-info)';
      case 'fix':
        return 'var(--color-warning)';
      case 'security':
        return 'var(--color-danger)';
      default:
        return 'var(--color-gray-500)';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'feature':
        return '✨';
      case 'enhancement':
        return '🚀';
      case 'fix':
        return '🔧';
      case 'security':
        return '🔒';
      default:
        return '📝';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">What's New</h2>
          <button className="modal-close" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading changelog...</p>
            </div>
          ) : changes.length === 0 ? (
            <div className="empty-state">
              <p>No changes recorded yet.</p>
            </div>
          ) : (
            <div className="changelog-list">
              {changes.map((change) => (
                <div key={change.id} className="changelog-item">
                  <div className="changelog-header">
                    <div className="changelog-title-row">
                      <span className="changelog-icon">{getCategoryIcon(change.category)}</span>
                      <h3 className="changelog-title">{change.title}</h3>
                      <span 
                        className="changelog-badge" 
                        style={{ backgroundColor: getCategoryColor(change.category) }}
                      >
                        {change.category}
                      </span>
                    </div>
                    <div className="changelog-meta">
                      <span className="changelog-version">v{change.version}</span>
                      <span className="changelog-date">{new Date(change.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <p className="changelog-description">{change.description}</p>
                  
                  {change.details && change.details.length > 0 && (
                    <ul className="changelog-details">
                      {change.details.map((detail, index) => (
                        <li key={index}>{detail}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          padding: var(--space-lg);
          backdrop-filter: blur(4px);
        }

        .modal-content {
          background: var(--color-white);
          border-radius: var(--border-radius-lg);
          box-shadow: var(--shadow-xl);
          max-width: 700px;
          width: 100%;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
          animation: slideIn 0.2s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-lg);
          border-bottom: var(--border-width) solid var(--color-gray-200);
        }

        .modal-title {
          margin: 0;
          font-size: var(--font-size-xl);
          font-weight: 600;
          color: var(--color-gray-900);
        }

        .modal-close {
          background: none;
          border: none;
          padding: var(--space-sm);
          cursor: pointer;
          color: var(--color-gray-500);
          border-radius: var(--border-radius);
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-close:hover {
          background: var(--color-gray-100);
          color: var(--color-gray-700);
        }

        .modal-body {
          flex: 1;
          overflow-y: auto;
          padding: var(--space-lg);
        }

        .loading-state,
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--space-xl) 0;
          gap: var(--space-md);
          color: var(--color-gray-600);
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid var(--color-gray-200);
          border-top: 3px solid var(--color-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .changelog-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }

        .changelog-item {
          background: var(--color-gray-50);
          border-radius: var(--border-radius-lg);
          padding: var(--space-lg);
          border: var(--border-width) solid var(--color-gray-200);
          transition: all 0.15s ease;
        }

        .changelog-item:hover {
          border-color: var(--color-gray-300);
          box-shadow: var(--shadow-sm);
        }

        .changelog-header {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
          margin-bottom: var(--space-md);
        }

        .changelog-title-row {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          flex-wrap: wrap;
        }

        .changelog-icon {
          font-size: var(--font-size-lg);
        }

        .changelog-title {
          margin: 0;
          font-size: var(--font-size-lg);
          font-weight: 600;
          color: var(--color-gray-900);
          flex: 1;
        }

        .changelog-badge {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: var(--font-size-xs);
          font-weight: 600;
          color: var(--color-white);
          text-transform: uppercase;
        }

        .changelog-meta {
          display: flex;
          gap: var(--space-md);
          font-size: var(--font-size-sm);
          color: var(--color-gray-600);
        }

        .changelog-version {
          font-weight: 600;
          color: var(--color-primary);
        }

        .changelog-description {
          margin: 0 0 var(--space-md) 0;
          color: var(--color-gray-700);
          line-height: 1.5;
        }

        .changelog-details {
          margin: 0;
          padding-left: var(--space-lg);
          display: flex;
          flex-direction: column;
          gap: var(--space-xs);
        }

        .changelog-details li {
          color: var(--color-gray-600);
          line-height: 1.5;
          font-size: var(--font-size-sm);
        }

        /* Mobile Styles */
        @media (max-width: 768px) {
          .modal-overlay {
            padding: var(--space-md);
          }

          .modal-content {
            max-height: 90vh;
          }

          .modal-header {
            padding: var(--space-md);
          }

          .modal-body {
            padding: var(--space-md);
          }

          .changelog-item {
            padding: var(--space-md);
          }

          .changelog-title-row {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
