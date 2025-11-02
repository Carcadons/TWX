import { useState, useEffect } from 'react';

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    email?: string | null;
    displayName?: string | null;
    company?: string | null;
    title?: string | null;
  } | null;
  onUpdate: () => void;
}

export default function AccountSettingsModal({ isOpen, onClose, user, onUpdate }: AccountSettingsModalProps) {
  const [displayName, setDisplayName] = useState('');
  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setCompany(user.company || '');
      setTitle(user.title || '');
    }
  }, [user]);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          displayName: displayName.trim() || null,
          company: company.trim() || null,
          title: title.trim() || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        onUpdate(); // Refresh user data in parent
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update profile' });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'An error occurred while updating your profile' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Modal Overlay */}
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Account Settings</h2>
            <button className="modal-close" onClick={onClose} title="Close">
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="modal-body">
            {/* Email (Read-only) */}
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={user?.email || ''}
                disabled
                className="form-control disabled"
              />
              <small className="form-text">Email cannot be changed</small>
            </div>

            {/* Display Name */}
            <div className="form-group">
              <label htmlFor="displayName">Display Name</label>
              <input
                type="text"
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
                className="form-control"
                maxLength={100}
              />
              <small className="form-text">How your name appears in the app</small>
            </div>

            {/* Company */}
            <div className="form-group">
              <label htmlFor="company">Company</label>
              <input
                type="text"
                id="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Enter your company name"
                className="form-control"
                maxLength={100}
              />
            </div>

            {/* Title */}
            <div className="form-group">
              <label htmlFor="title">Job Title</label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter your job title"
                className="form-control"
                maxLength={100}
              />
            </div>

            {/* Message */}
            {message && (
              <div className={`alert alert-${message.type}`}>
                {message.text}
              </div>
            )}

            {/* Actions */}
            <div className="modal-actions">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
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
          z-index: 1000;
          padding: var(--space-lg);
        }

        .modal-content {
          background: var(--color-white);
          border-radius: var(--border-radius-lg);
          box-shadow: var(--shadow-xl);
          max-width: 500px;
          width: 100%;
          max-height: 90vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-lg);
          border-bottom: var(--border-width) solid var(--color-gray-200);
        }

        .modal-header h2 {
          margin: 0;
          font-size: var(--font-size-xl);
          font-weight: 600;
          color: var(--color-gray-900);
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 32px;
          line-height: 1;
          color: var(--color-gray-500);
          cursor: pointer;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--border-radius);
          transition: all 0.15s ease;
        }

        .modal-close:hover {
          background: var(--color-gray-100);
          color: var(--color-gray-700);
        }

        .modal-body {
          padding: var(--space-lg);
          overflow-y: auto;
          flex: 1;
        }

        .form-group {
          margin-bottom: var(--space-lg);
        }

        .form-group:last-of-type {
          margin-bottom: 0;
        }

        .form-group label {
          display: block;
          margin-bottom: var(--space-sm);
          font-weight: 600;
          font-size: var(--font-size-sm);
          color: var(--color-gray-700);
        }

        .form-control {
          width: 100%;
          padding: var(--space-sm) var(--space-md);
          border: var(--border-width) solid var(--color-gray-300);
          border-radius: var(--border-radius);
          font-size: var(--font-size-base);
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .form-control:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(255, 107, 0, 0.1);
        }

        .form-control.disabled {
          background: var(--color-gray-100);
          color: var(--color-gray-600);
          cursor: not-allowed;
        }

        .form-text {
          display: block;
          margin-top: var(--space-xs);
          font-size: var(--font-size-xs);
          color: var(--color-gray-600);
        }

        .alert {
          padding: var(--space-md);
          border-radius: var(--border-radius);
          margin-bottom: var(--space-md);
          font-size: var(--font-size-sm);
        }

        .alert-success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .alert-error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: var(--space-md);
          margin-top: var(--space-lg);
        }

        .btn {
          padding: var(--space-sm) var(--space-lg);
          border-radius: var(--border-radius);
          font-size: var(--font-size-base);
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          border: none;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: var(--color-gray-200);
          color: var(--color-gray-700);
        }

        .btn-secondary:hover:not(:disabled) {
          background: var(--color-gray-300);
        }

        .btn-primary {
          background: var(--color-primary);
          color: var(--color-white);
        }

        .btn-primary:hover:not(:disabled) {
          background: var(--color-primary-dark);
        }

        @media (max-width: 768px) {
          .modal-content {
            max-width: 100%;
            margin: var(--space-md);
          }
        }
      `}</style>
    </>
  );
}
