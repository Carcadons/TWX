"use client";
import { useRef, useEffect, useState } from "react";
import { useDraggable } from "../hooks/useDraggable";
import { CONDITION_TYPES } from '../shared/constants';

interface AssetTransferFloatingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  assetId: string;
  currentProjectId: string;
  onTransferInitiated?: () => void;
}

export default function AssetTransferFloatingPanel({ 
  isOpen, 
  onClose, 
  assetId, 
  currentProjectId,
  onTransferInitiated 
}: AssetTransferFloatingPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [asset, setAsset] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    destinationProjectId: '',
    transferCondition: 'Good',
    conditionNotes: '',
    transferInspectionId: '',
  });

  const draggable = useDraggable({
    storageKey: 'twx-asset-transfer-panel-position',
    defaultPosition: typeof window !== 'undefined' 
      ? { x: (window.innerWidth - 750) / 2, y: (window.innerHeight - 650) / 2 }
      : { x: 100, y: 100 }
  });

  useEffect(() => {
    if (isOpen && assetId) {
      fetchData();
    }
  }, [isOpen, assetId]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [assetRes, projectsRes] = await Promise.all([
        fetch(`/api/elements/${assetId}`),
        fetch('/api/projects'),
      ]);

      if (!assetRes.ok || !projectsRes.ok) {
        throw new Error('Failed to load data');
      }

      const [assetData, projectsData] = await Promise.all([
        assetRes.json(),
        projectsRes.json(),
      ]);

      setAsset(assetData);
      // projectsData has shape { success: true, data: [...] }
      const projectsList = projectsData.data || [];
      setProjects(projectsList.filter((p: any) => p.id !== currentProjectId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleInitiateTransfer = async () => {
    if (!formData.destinationProjectId) {
      setError('Please select a destination project');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/elements/${assetId}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to initiate transfer');
      }

      const result = await response.json();
      if (onTransferInitiated) {
        onTransferInitiated();
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate transfer');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div 
          ref={panelRef}
          className="floating-panel"
          style={{
            left: `${draggable.position.x}px`,
            top: `${draggable.position.y}px`
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div 
            className="panel-header"
            onMouseDown={draggable.handleMouseDown}
            style={{ cursor: 'move' }}
          >
            <h3>📦 Transfer Asset to Another Project</h3>
            <button onClick={onClose} className="close-button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div className="panel-content">
            {loading ? (
              <div className="loading-state">Loading asset details...</div>
            ) : !asset ? (
              <div className="error-message">Failed to load asset information</div>
            ) : (
              <>
                {error && <div className="error-message">{error}</div>}

                <div className="asset-info">
                  <h4>Asset Information</h4>
                  <table>
                    <tbody>
                      <tr>
                        <td><strong>Asset Number:</strong></td>
                        <td>{asset.assetNumber}</td>
                      </tr>
                      <tr>
                        <td><strong>Description:</strong></td>
                        <td>{asset.description}</td>
                      </tr>
                      <tr>
                        <td><strong>Current Condition:</strong></td>
                        <td>{asset.currentCondition}</td>
                      </tr>
                      <tr>
                        <td><strong>Current Status:</strong></td>
                        <td>
                          <span className={`status-badge status-${asset.status}`}>
                            {asset.status}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {asset.status !== 'active' && (
                  <div className="warning-message">
                    ⚠️ This asset is currently {asset.status}. Only active assets can be transferred.
                  </div>
                )}

                <div className="transfer-form">
                  <div className="form-group">
                    <label>Destination Project *</label>
                    <select
                      value={formData.destinationProjectId}
                      onChange={(e) => handleInputChange('destinationProjectId', e.target.value)}
                      required
                    >
                      <option value="">Select destination project...</option>
                      {projects.map(project => (
                        <option key={project.id} value={project.id}>
                          {project.name} ({project.status})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Transfer Condition *</label>
                    <select
                      value={formData.transferCondition}
                      onChange={(e) => handleInputChange('transferCondition', e.target.value)}
                      required
                    >
                      {CONDITION_TYPES.map(condition => (
                        <option key={condition} value={condition}>{condition}</option>
                      ))}
                    </select>
                    <p className="help-text">Condition assessment at time of transfer</p>
                  </div>

                  <div className="form-group">
                    <label>Condition Notes</label>
                    <textarea
                      value={formData.conditionNotes}
                      onChange={(e) => handleInputChange('conditionNotes', e.target.value)}
                      placeholder="Any observations about condition, wear, damage, etc."
                      rows={4}
                    />
                  </div>

                  <div className="form-group">
                    <label>Transfer Inspection ID</label>
                    <input
                      type="text"
                      value={formData.transferInspectionId}
                      onChange={(e) => handleInputChange('transferInspectionId', e.target.value)}
                      placeholder="Reference to inspection record (optional)"
                    />
                    <p className="help-text">Link to formal transfer inspection if conducted</p>
                  </div>
                </div>

                <div className="approval-info">
                  <h4>Transfer Approval Process</h4>
                  <ol>
                    <li>🔄 <strong>Transfer Initiated:</strong> Request created with asset details</li>
                    <li>✅ <strong>Source Project Manager:</strong> Must approve asset removal</li>
                    <li>✅ <strong>Destination Project Manager:</strong> Must approve asset receipt</li>
                    <li>📦 <strong>Asset Status:</strong> Changes to "in transit" after approval</li>
                    <li>🎯 <strong>Receive Asset:</strong> Destination project completes receipt inspection</li>
                  </ol>
                  <p className="info-note">
                    Both project managers must approve before the asset can be received in the destination project.
                  </p>
                </div>

                <div className="button-group">
                  <button className="btn-secondary" onClick={onClose}>
                    Cancel
                  </button>
                  <button 
                    className="btn-primary" 
                    onClick={handleInitiateTransfer}
                    disabled={submitting || !formData.destinationProjectId || asset.status !== 'active'}
                  >
                    {submitting ? 'Initiating Transfer...' : 'Initiate Transfer'}
                  </button>
                </div>
              </>
            )}
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
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .floating-panel {
          position: fixed;
          width: 750px;
          max-width: 95vw;
          max-height: 90vh;
          background: white;
          border-radius: 8px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-md);
          background: linear-gradient(135deg, #ff9800 0%, #ffa726 100%);
          color: white;
          user-select: none;
        }

        .panel-header h3 {
          margin: 0;
          font-size: var(--font-size-lg);
          font-weight: 600;
        }

        .close-button {
          background: transparent;
          border: none;
          color: white;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: background-color 0.2s;
        }

        .close-button:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .panel-content {
          flex: 1;
          overflow-y: auto;
          padding: var(--space-lg);
        }

        .loading-state {
          text-align: center;
          padding: var(--space-xl);
          color: var(--color-text-secondary);
        }

        .error-message {
          background: #fee;
          border: 1px solid #fcc;
          color: #c33;
          padding: var(--space-md);
          border-radius: var(--border-radius);
          margin-bottom: var(--space-md);
        }

        .asset-info {
          background: var(--color-bg-secondary);
          padding: var(--space-md);
          border-radius: var(--border-radius);
          margin-bottom: var(--space-lg);
        }

        .asset-info h4 {
          margin-top: 0;
          margin-bottom: var(--space-md);
          color: var(--color-text-primary);
        }

        .asset-info table {
          width: 100%;
          border-collapse: collapse;
        }

        .asset-info td {
          padding: var(--space-xs) var(--space-sm);
          border-bottom: 1px solid var(--color-border);
        }

        .asset-info td:first-child {
          width: 40%;
        }

        .status-badge {
          display: inline-block;
          padding: var(--space-xs) var(--space-sm);
          border-radius: var(--border-radius);
          font-size: var(--font-size-sm);
          text-transform: capitalize;
          font-weight: 600;
        }

        .status-active {
          background: var(--color-success);
          color: white;
        }

        .status-in_transit {
          background: var(--color-warning);
          color: white;
        }

        .warning-message {
          background: #fff3cd;
          border: 1px solid #ffc107;
          color: #856404;
          padding: var(--space-md);
          border-radius: var(--border-radius);
          margin-bottom: var(--space-lg);
        }

        .transfer-form {
          margin: var(--space-lg) 0;
        }

        .form-group {
          margin-bottom: var(--space-md);
        }

        .form-group label {
          display: block;
          font-weight: 600;
          margin-bottom: var(--space-xs);
          color: var(--color-text-primary);
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: var(--space-sm);
          border: 1px solid var(--color-border);
          border-radius: var(--border-radius);
          font-size: var(--font-size-md);
          box-sizing: border-box;
          font-family: inherit;
        }

        .help-text {
          margin: var(--space-xs) 0 0 0;
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          font-style: italic;
        }

        .approval-info {
          background: var(--color-primary-light);
          padding: var(--space-md);
          border-radius: var(--border-radius);
          border-left: 3px solid var(--color-primary);
          margin-bottom: var(--space-lg);
        }

        .approval-info h4 {
          margin-top: 0;
          color: var(--color-primary);
        }

        .approval-info ol {
          margin: var(--space-md) 0;
          padding-left: var(--space-lg);
        }

        .approval-info li {
          margin-bottom: var(--space-sm);
          line-height: 1.6;
        }

        .info-note {
          margin: var(--space-md) 0 0 0;
          font-size: var(--font-size-sm);
          font-style: italic;
          color: var(--color-text-secondary);
        }

        .button-group {
          display: flex;
          gap: var(--space-md);
          justify-content: flex-end;
          margin-top: var(--space-lg);
        }

        .btn-primary,
        .btn-secondary {
          padding: var(--space-sm) var(--space-lg);
          border: none;
          border-radius: var(--border-radius);
          cursor: pointer;
          font-size: var(--font-size-md);
          font-weight: 600;
          transition: opacity 0.2s;
        }

        .btn-primary {
          background: var(--color-primary);
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          opacity: 0.9;
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: var(--color-bg-secondary);
          color: var(--color-text-primary);
          border: 1px solid var(--color-border);
        }

        .btn-secondary:hover {
          background: var(--color-border);
        }
      `}</style>
    </>
  );
}
