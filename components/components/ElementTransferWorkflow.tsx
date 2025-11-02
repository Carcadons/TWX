import { useState, useEffect } from 'react';
import { CONDITION_TYPES } from '../shared/constants';

interface ElementTransferWorkflowProps {
  elementId: string;
  currentProjectId: string;
  onClose: () => void;
  onTransferInitiated: () => void;
}

export default function ElementTransferWorkflow({
  elementId,
  currentProjectId,
  onClose,
  onTransferInitiated,
}: ElementTransferWorkflowProps) {
  const [element, setElement] = useState<any>(null);
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

  useEffect(() => {
    fetchData();
  }, [elementId]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [elementRes, projectsRes] = await Promise.all([
        fetch(`/api/elements/${elementId}`),
        fetch('/api/projects'),
      ]);

      if (!elementRes.ok || !projectsRes.ok) {
        throw new Error('Failed to load data');
      }

      const [elementData, projectsData] = await Promise.all([
        elementRes.json(),
        projectsRes.json(),
      ]);

      setElement(elementData);
      setProjects(projectsData.filter((p: any) => p.id !== currentProjectId));
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
      const response = await fetch(`/api/elements/${elementId}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to initiate transfer');
      }

      const result = await response.json();
      onTransferInitiated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate transfer');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  if (!element) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content transfer-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Transfer Element to Another Project</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}

          <div className="element-info">
            <h3>Asset to Transfer</h3>
            <table>
              <tbody>
                <tr>
                  <td><strong>Asset Number:</strong></td>
                  <td>{element.assetNumber}</td>
                </tr>
                <tr>
                  <td><strong>Description:</strong></td>
                  <td>{element.description}</td>
                </tr>
                <tr>
                  <td><strong>Current Condition:</strong></td>
                  <td>{element.currentCondition}</td>
                </tr>
                <tr>
                  <td><strong>Current Status:</strong></td>
                  <td>
                    <span className={`status-badge status-${element.status}`}>
                      {element.status}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {element.status !== 'active' && (
            <div className="warning-message">
              ⚠️ This element is currently {element.status}. Only active elements can be transferred.
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
              <li>🔄 <strong>Transfer Initiated:</strong> Request created with element details</li>
              <li>✅ <strong>Source Project Manager:</strong> Must approve element removal</li>
              <li>✅ <strong>Destination Project Manager:</strong> Must approve element receipt</li>
              <li>📦 <strong>Element Status:</strong> Changes to "in transit" after approval</li>
              <li>🎯 <strong>Receive Element:</strong> Destination project completes receipt inspection</li>
            </ol>
            <p className="info-note">
              Both project managers must approve before the element can be received in the destination project.
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button 
            className="btn-primary" 
            onClick={handleInitiateTransfer}
            disabled={submitting || !formData.destinationProjectId || element.status !== 'active'}
          >
            {submitting ? 'Initiating Transfer...' : 'Initiate Transfer'}
          </button>
        </div>

        <style jsx>{`
          .transfer-modal {
            max-width: 700px;
            max-height: 90vh;
            overflow-y: auto;
          }

          .element-info {
            background: var(--color-bg-secondary);
            padding: var(--space-md);
            border-radius: var(--border-radius);
            margin-bottom: var(--space-lg);
          }

          .element-info h3 {
            margin-top: 0;
            margin-bottom: var(--space-md);
          }

          .element-info table {
            width: 100%;
            border-collapse: collapse;
          }

          .element-info td {
            padding: var(--space-xs) var(--space-sm);
            border-bottom: 1px solid var(--color-border);
          }

          .element-info td:first-child {
            width: 40%;
          }

          .status-badge {
            display: inline-block;
            padding: var(--space-xs) var(--space-sm);
            border-radius: var(--border-radius);
            font-size: var(--font-size-sm);
            text-transform: capitalize;
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
        `}</style>
      </div>
    </div>
  );
}
