import { useState, useEffect } from 'react';

interface ElementHistoryPanelProps {
  elementId: string;
  onClose: () => void;
}

interface HistoryRecord {
  historyRecord: any;
  project: any;
}

export default function ElementHistoryPanel({ elementId, onClose }: ElementHistoryPanelProps) {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [inspections, setInspections] = useState<any[]>([]);
  const [element, setElement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

  useEffect(() => {
    fetchElementHistory();
  }, [elementId]);

  const fetchElementHistory = async () => {
    setLoading(true);
    setError(null);

    try {
      const [elementRes, historyRes, inspectionsRes] = await Promise.all([
        fetch(`/api/elements/${elementId}`),
        fetch(`/api/elements/${elementId}/history`),
        fetch(`/api/elements/${elementId}/inspections`),
      ]);

      if (!elementRes.ok || !historyRes.ok || !inspectionsRes.ok) {
        throw new Error('Failed to fetch element history');
      }

      const [elementData, historyData, inspectionsData] = await Promise.all([
        elementRes.json(),
        historyRes.json(),
        inspectionsRes.json(),
      ]);

      setElement(elementData);
      setHistory(historyData);
      setInspections(inspectionsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const getInspectionsForProject = (projectId: string) => {
    return inspections.filter(insp => insp.projectId === projectId);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return '⭐';
      case 'transferred_out':
        return '➡️';
      case 'pending_approval':
        return '⏳';
      case 'completed':
        return '✅';
      default:
        return '📦';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateDaysInProject = (record: any) => {
    const start = record.activatedDate ? new Date(record.activatedDate) : null;
    const end = record.deactivatedDate ? new Date(record.deactivatedDate) : new Date();
    
    if (!start) return null;
    
    const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  if (loading) {
    return (
      <div className="history-panel">
        <div className="loading">Loading history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="history-panel">
        <div className="error-message">{error}</div>
        <button onClick={onClose}>Close</button>
      </div>
    );
  }

  if (!element) {
    return null;
  }

  return (
    <div className="history-panel">
      <div className="panel-header">
        <div>
          <h2>Asset History: {element.assetNumber}</h2>
          <p className="element-description">{element.description}</p>
        </div>
        <button className="close-button" onClick={onClose}>×</button>
      </div>

      <div className="element-summary">
        <div className="summary-grid">
          <div className="summary-item">
            <span className="label">IFC Type:</span>
            <span className="value">{element.ifcType}</span>
          </div>
          <div className="summary-item">
            <span className="label">Current Status:</span>
            <span className={`value status-badge status-${element.status}`}>
              {element.status}
            </span>
          </div>
          <div className="summary-item">
            <span className="label">Current Condition:</span>
            <span className="value">{element.currentCondition}</span>
          </div>
          <div className="summary-item">
            <span className="label">Total Projects:</span>
            <span className="value">{history.length}</span>
          </div>
          <div className="summary-item">
            <span className="label">Total Inspections:</span>
            <span className="value">{inspections.length}</span>
          </div>
          {element.serialNumber && (
            <div className="summary-item">
              <span className="label">Serial Number:</span>
              <span className="value">{element.serialNumber}</span>
            </div>
          )}
        </div>
      </div>

      <div className="timeline-container">
        <h3>Project Timeline</h3>
        
        {history.length === 0 ? (
          <div className="empty-state">
            <p>No project history available</p>
          </div>
        ) : (
          <div className="timeline">
            {history.map((record, index) => {
              const projectInspections = getInspectionsForProject(record.historyRecord.projectId);
              const isExpanded = expandedProject === record.historyRecord.projectId;
              const daysInProject = calculateDaysInProject(record.historyRecord);
              const isActive = record.historyRecord.status === 'active';

              return (
                <div key={index} className={`timeline-item ${isActive ? 'active' : ''}`}>
                  <div className="timeline-marker">
                    <span className="status-icon">{getStatusIcon(record.historyRecord.status)}</span>
                  </div>
                  
                  <div className="timeline-content">
                    <div 
                      className="timeline-header"
                      onClick={() => setExpandedProject(isExpanded ? null : record.historyRecord.projectId)}
                    >
                      <div>
                        <h4>
                          {record.project?.name || `Project ${record.historyRecord.projectId}`}
                          {isActive && <span className="active-badge">Active</span>}
                        </h4>
                        <p className="timeline-dates">
                          {formatDate(record.historyRecord.activatedDate)} 
                          {record.historyRecord.deactivatedDate ? ` - ${formatDate(record.historyRecord.deactivatedDate)}` : ' - Present'}
                          {daysInProject !== null && ` (${daysInProject} days)`}
                        </p>
                      </div>
                      <div className="timeline-stats">
                        <span className="inspection-count">
                          {projectInspections.length} inspection{projectInspections.length !== 1 ? 's' : ''}
                        </span>
                        <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="timeline-details">
                        <div className="detail-grid">
                          <div className="detail-item">
                            <strong>Status:</strong> {record.historyRecord.status}
                          </div>
                          <div className="detail-item">
                            <strong>Received Condition:</strong> {record.historyRecord.receivedCondition || 'N/A'}
                          </div>
                          {record.historyRecord.transferredCondition && (
                            <div className="detail-item">
                              <strong>Transferred Condition:</strong> {record.historyRecord.transferredCondition}
                            </div>
                          )}
                          {record.historyRecord.actualLocation && (
                            <div className="detail-item">
                              <strong>Location:</strong> {record.historyRecord.actualLocation}
                            </div>
                          )}
                        </div>

                        {record.historyRecord.conditionNotes && (
                          <div className="condition-notes">
                            <strong>Notes:</strong>
                            <p>{record.historyRecord.conditionNotes}</p>
                          </div>
                        )}

                        {projectInspections.length > 0 && (
                          <div className="inspections-list">
                            <strong>Inspections:</strong>
                            <ul>
                              {projectInspections.map((insp) => (
                                <li key={insp.id}>
                                  <span className={`inspection-status status-${insp.status}`}>
                                    {insp.status}
                                  </span>
                                  {' '}
                                  {formatDate(insp.date)} - {insp.inspector}
                                  {insp.inspectionType && ` (${insp.inspectionType})`}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {index < history.length - 1 && (
                    <div className="timeline-transition">
                      <div className="transfer-arrow">⬇</div>
                      <div className="transfer-label">
                        {record.historyRecord.transferDate 
                          ? `Transferred ${formatDate(record.historyRecord.transferDate)}`
                          : 'Transfer in progress'}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        .history-panel {
          background: white;
          border-radius: var(--border-radius);
          padding: var(--space-lg);
          max-height: 90vh;
          overflow-y: auto;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--space-lg);
          padding-bottom: var(--space-md);
          border-bottom: 2px solid var(--color-border);
        }

        .panel-header h2 {
          margin: 0 0 var(--space-xs) 0;
          color: var(--color-text-primary);
        }

        .element-description {
          margin: 0;
          color: var(--color-text-secondary);
        }

        .element-summary {
          background: var(--color-bg-secondary);
          padding: var(--space-md);
          border-radius: var(--border-radius);
          margin-bottom: var(--space-lg);
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--space-md);
        }

        .summary-item {
          display: flex;
          flex-direction: column;
        }

        .summary-item .label {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          margin-bottom: var(--space-xs);
        }

        .summary-item .value {
          font-size: var(--font-size-md);
          font-weight: 600;
          color: var(--color-text-primary);
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

        .status-transferred_out {
          background: var(--color-text-secondary);
          color: white;
        }

        .timeline-container {
          margin-top: var(--space-xl);
        }

        .timeline-container h3 {
          margin-bottom: var(--space-lg);
        }

        .timeline {
          position: relative;
          padding-left: 40px;
        }

        .timeline::before {
          content: '';
          position: absolute;
          left: 15px;
          top: 0;
          bottom: 0;
          width: 2px;
          background: var(--color-border);
        }

        .timeline-item {
          position: relative;
          margin-bottom: var(--space-lg);
        }

        .timeline-item.active {
          border-left: 3px solid var(--color-primary);
          padding-left: var(--space-sm);
          margin-left: -3px;
        }

        .timeline-marker {
          position: absolute;
          left: -25px;
          top: 5px;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: white;
          border: 2px solid var(--color-border);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1;
        }

        .timeline-item.active .timeline-marker {
          border-color: var(--color-primary);
          background: var(--color-primary-light);
        }

        .timeline-content {
          background: var(--color-bg-secondary);
          border-radius: var(--border-radius);
          overflow: hidden;
        }

        .timeline-header {
          padding: var(--space-md);
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .timeline-header:hover {
          background: var(--color-bg-tertiary);
        }

        .timeline-header h4 {
          margin: 0 0 var(--space-xs) 0;
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .active-badge {
          background: var(--color-primary);
          color: white;
          padding: 2px 8px;
          border-radius: var(--border-radius);
          font-size: var(--font-size-xs);
          font-weight: 600;
        }

        .timeline-dates {
          margin: 0;
          color: var(--color-text-secondary);
          font-size: var(--font-size-sm);
        }

        .timeline-stats {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }

        .inspection-count {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }

        .expand-icon {
          color: var(--color-text-secondary);
        }

        .timeline-details {
          padding: var(--space-md);
          border-top: 1px solid var(--color-border);
          background: white;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--space-sm);
          margin-bottom: var(--space-md);
        }

        .detail-item {
          font-size: var(--font-size-sm);
        }

        .condition-notes {
          margin: var(--space-md) 0;
          padding: var(--space-sm);
          background: var(--color-bg-secondary);
          border-radius: var(--border-radius);
          font-size: var(--font-size-sm);
        }

        .condition-notes p {
          margin: var(--space-xs) 0 0 0;
        }

        .inspections-list {
          margin-top: var(--space-md);
          font-size: var(--font-size-sm);
        }

        .inspections-list ul {
          list-style: none;
          padding: 0;
          margin: var(--space-sm) 0 0 0;
        }

        .inspections-list li {
          padding: var(--space-xs) 0;
          border-bottom: 1px solid var(--color-border);
        }

        .inspections-list li:last-child {
          border-bottom: none;
        }

        .inspection-status {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: var(--font-size-xs);
          font-weight: 600;
        }

        .inspection-status.status-approved {
          background: var(--color-success);
          color: white;
        }

        .inspection-status.status-pending {
          background: var(--color-warning);
          color: white;
        }

        .timeline-transition {
          text-align: center;
          padding: var(--space-sm) 0;
        }

        .transfer-arrow {
          font-size: 24px;
          color: var(--color-text-secondary);
        }

        .transfer-label {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          font-style: italic;
        }

        .empty-state {
          text-align: center;
          padding: var(--space-xl);
          color: var(--color-text-secondary);
        }
      `}</style>
    </div>
  );
}
