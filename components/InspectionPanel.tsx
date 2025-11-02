"use client";
import { useState, useEffect, useRef } from "react";
import { twxApi, useTWXApi } from "../lib/api";

interface SelectedElement {
  id: string;
  name: string;
  type: string;
  properties: Record<string, any>;
}

interface InspectionPanelProps {
  selectedElement: SelectedElement | null;
  projectId: string;
  onInspectionChange: () => void;
}

interface InspectionData {
  inspector: string;
  status: string;
  notes: string;
  date: string;
  timestamp?: string;
}

export default function InspectionPanel({ selectedElement, projectId, onInspectionChange }: InspectionPanelProps) {
  const { api, isOnline, currentProject } = useTWXApi();

  const [formData, setFormData] = useState<InspectionData>({
    inspector: "",
    status: "",
    notes: "",
    date: new Date().toISOString().split('T')[0],
    timestamp: ""
  });

  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [panelWidth, setPanelWidth] = useState(380);
  const [isResizing, setIsResizing] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // Set the project ID on the API service when projectId prop changes
  useEffect(() => {
    if (projectId && projectId !== currentProject) {
      console.log(`🆔 InspectionPanel: Setting project ID to ${projectId}`);
      api.setProject(projectId);
    }
  }, [projectId, currentProject, api]);

  // Handle panel resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !panelRef.current) return;

      const containerRect = panelRef.current.parentElement?.getBoundingClientRect();
      if (!containerRect) return;

      const newWidth = containerRect.right - e.clientX;
      const clampedWidth = Math.max(300, Math.min(600, newWidth));
      setPanelWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    if (isResizing) {
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  // Load inspection data when element changes
  useEffect(() => {
    console.log("🔍 InspectionPanel selectedElement changed:", selectedElement);

    if (selectedElement) {
      loadInspectionData(selectedElement.id);
    } else {
      setFormData({
        inspector: "",
        status: "",
        notes: "",
        date: new Date().toISOString().split('T')[0],
        timestamp: ""
      });
    }
  }, [selectedElement]);

  // Load inspection data from API
  const loadInspectionData = async (elementId: string) => {
    if (!elementId || !projectId) return;

    setIsLoading(true);
    setSaveStatus('idle');

    try {
      console.log(`🔍 Loading inspection for element ${elementId} in project ${projectId}`);
      const inspection = await api.getInspectionByElement(elementId, projectId);

      if (inspection) {
        console.log("🔍 Loaded inspection data from API:", inspection);
        setFormData({
          inspector: inspection.inspector || "",
          status: inspection.status || "",
          notes: inspection.notes || "",
          date: inspection.date || new Date().toISOString().split('T')[0],
          timestamp: inspection.timestamp || ""
        });
      } else {
        console.log("🔍 No inspection data found, using defaults");
        setFormData({
          inspector: "",
          status: "",
          notes: "",
          date: new Date().toISOString().split('T')[0],
          timestamp: ""
        });
      }
    } catch (error) {
      console.error("❌ Failed to load inspection data:", error);
      setSaveStatus('error');

      setFormData({
        inspector: "",
        status: "",
        notes: "",
        date: new Date().toISOString().split('T')[0],
        timestamp: ""
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Save inspection data with debouncing
  const saveInspection = async (data: InspectionData, skipDebounce = false) => {
    if (!selectedElement || !projectId) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    const performSave = async () => {
      setSaveStatus('saving');

      try {
        if (isOnline) {
          console.log(`💾 Saving inspection for element ${selectedElement.id} in project ${projectId}`);

          const saved = await api.saveInspection({
            elementId: selectedElement.id,
            projectId: projectId, // Explicitly set project ID
            inspector: data.inspector,
            status: data.status as 'ok' | 'issue' | '',
            notes: data.notes,
            date: data.date,
            lastModifiedBy: 'user'
          }, projectId);

          if (saved) {
            console.log("💾 Saved inspection to API:", saved);
            setSaveStatus('saved');
            onInspectionChange();
          } else {
            throw new Error('API save failed');
          }
        } else {
          console.log("❌ Cannot save - API is offline");
          setSaveStatus('error');
        }

        setTimeout(() => setSaveStatus('idle'), 2000);

      } catch (error) {
        console.error("❌ Failed to save inspection:", error);
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    };

    if (skipDebounce) {
      await performSave();
    } else {
      saveTimeoutRef.current = setTimeout(performSave, 1000);
    }
  };

  // Update form field
  const updateField = (field: keyof InspectionData, value: string) => {
    const newData = { ...formData, [field]: value };
    console.log("📝 Updating field:", field, "to:", value);
    setFormData(newData);

    if (selectedElement && (newData.inspector || newData.status || newData.notes)) {
      saveInspection(newData);
    }
  };

  // Clear inspection
  const clearInspection = async () => {
    if (!selectedElement || !projectId) return;

    const clearedData = {
      inspector: "",
      status: "",
      notes: "",
      date: new Date().toISOString().split('T')[0],
      timestamp: ""
    };

    setFormData(clearedData);

    try {
      if (isOnline) {
        console.log(`🗑️ Clearing inspection for element ${selectedElement.id} in project ${projectId}`);
        const existing = await api.getInspectionByElement(selectedElement.id, projectId);
        if (existing?.id) {
          await api.deleteInspection(existing.id);
        }
      } else {
        console.log("❌ Cannot clear - API is offline");
      }

      onInspectionChange();
      console.log("🗑️ Cleared inspection for element:", selectedElement.id);
    } catch (error) {
      console.error("❌ Failed to clear inspection:", error);
    }
  };

  // Export all data
  const exportAllData = async () => {
    if (!projectId) {
      console.error("❌ Cannot export - no project ID");
      return;
    }

    try {
      console.log(`📁 Exporting data for project: ${projectId}`);
      const exportData = await api.exportData(projectId);

      if (exportData) {
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `twx-inspections-${projectId}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        console.log("📁 Exported data:", exportData);
      } else {
        throw new Error('No data to export from API');
      }
    } catch (error) {
      console.error("❌ Export failed:", error);
      alert("Export failed - make sure the API is online and contains data");
    }
  };

  // Status color helper
  const getStatusColor = (status: string) => {
    switch (status) {
      case "ok": return "var(--color-success)";
      case "issue": return "var(--color-error)";
      default: return "var(--color-gray-400)";
    }
  };

  // Save status indicator
  const getSaveStatusText = () => {
    switch (saveStatus) {
      case 'saving': return `Saving to project ${projectId}...`;
      case 'saved': return `Saved to project ${projectId}`;
      case 'error': return 'Save failed - API offline';
      default: return isOnline ? `Auto-save to project ${projectId}` : 'API offline - cannot save';
    }
  };

  const getSaveStatusColor = () => {
    switch (saveStatus) {
      case 'saving': return 'var(--color-warning)';
      case 'saved': return 'var(--color-success)';
      case 'error': return 'var(--color-error)';
      default: return 'var(--color-gray-500)';
    }
  };

  return (
    <div 
      ref={panelRef}
      className="inspection-panel" 
      style={{ width: `${panelWidth}px` }}
    >
      {/* Custom Resize Handle */}
      <div
        className="resize-handle"
        onMouseDown={handleResizeStart}
      />

      {/* Header */}
      <div className="panel-header">
        <div className="header-left">
          <h2>BIM Inspection</h2>
          <div className="connection-status">
            <div 
              className={`status-dot ${isOnline ? 'online' : 'offline'}`}
            />
            <span className="status-text">
              {isOnline ? 'Online' : 'Offline'}
            </span>
            {projectId && (
              <span className="project-id">• {projectId}</span>
            )}
          </div>
        </div>
        <div className="header-actions">
          <button onClick={exportAllData} className="btn btn-sm btn-secondary">
            Export
          </button>
        </div>
      </div>

      {selectedElement ? (
        <div className="panel-content">
          {/* Element Info */}
          <div className="card">
            <div className="card-header">
              <h3>Element Details</h3>
              {isLoading && (
                <div className="loading-spinner-small"></div>
              )}
            </div>
            <div className="card-body">
              <div className="element-name">{selectedElement.name}</div>

              <div className="property-list">
                <div className="property-item">
                  <span className="property-key">Type</span>
                  <span className="property-value">{selectedElement.type}</span>
                </div>

                <div className="property-item">
                  <span className="property-key">ID</span>
                  <span className="property-value property-id">{selectedElement.id}</span>
                </div>

                {Object.entries(selectedElement.properties).map(([key, value]) => {
                  if (!value || key === 'id' || key === 'name' || typeof value === 'object') return null;

                  return (
                    <div key={key} className="property-item">
                      <span className="property-key">
                        {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      </span>
                      <span className="property-value">{String(value)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Inspection Form */}
          <div className="card">
            <div className="card-header">
              <h3>Inspection Form</h3>
              {(formData.inspector || formData.status || formData.notes) && (
                <button onClick={clearInspection} className="btn btn-sm btn-error">
                  Clear
                </button>
              )}
            </div>

            <div className="card-body">
              <div className="form-container">
                {/* Inspector Field */}
                <div className="form-group">
                  <label className="form-label">Inspector</label>
                  <input
                    type="text"
                    value={formData.inspector}
                    onChange={(e) => updateField('inspector', e.target.value)}
                    placeholder="Enter inspector name"
                    className="form-input"
                    disabled={isLoading}
                  />
                </div>

                {/* Status Field */}
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <div className="status-select-wrapper">
                    <select
                      value={formData.status}
                      onChange={(e) => updateField('status', e.target.value)}
                      className={`form-select status-select ${formData.status ? `status-${formData.status}` : ''}`}
                      disabled={isLoading}
                    >
                      <option value="">Select Status</option>
                      <option value="ok">✓ Passed</option>
                      <option value="issue">⚠ Requires Attention</option>
                    </select>
                  </div>
                </div>

                {/* Date Field */}
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => updateField('date', e.target.value)}
                    className="form-input"
                    disabled={isLoading}
                  />
                </div>

                {/* Notes Field */}
                <div className="form-group form-group-full">
                  <label className="form-label">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => updateField('notes', e.target.value)}
                    placeholder="Add inspection notes..."
                    rows={3}
                    className="form-textarea"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Status Preview */}
              {formData.status && (
                <div className="status-preview">
                  <div 
                    className="status-indicator"
                    style={{ background: getStatusColor(formData.status) }}
                  ></div>
                  <span>
                    Element will be colored: {formData.status === 'ok' ? 'Green (Passed)' : 'Red (Issues)'}
                  </span>
                </div>
              )}
            </div>

            {/* Auto-save status */}
            <div className="card-footer">
              <div 
                className="auto-save-note"
                style={{ color: getSaveStatusColor() }}
              >
                {getSaveStatusText()}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Welcome State */
        <div className="welcome-state">
          <div className="welcome-content">
            <div className="welcome-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7L12 12L22 7L12 2Z"/>
                <path d="M2 17L12 22L22 17"/>
                <path d="M2 12L12 17L22 12"/>
              </svg>
            </div>
            <h3>BIM Inspection Panel</h3>
            <p>
              Click any building element in the 3D view to inspect its properties and add inspection data.
            </p>

            <div className="feature-list">
              <div className="feature-item">
                {isOnline ? `🟢 Connected to project ${projectId}` : '🔴 Database offline'}
              </div>
              <div className="feature-item">Click elements to see BIM properties</div>
              <div className="feature-item">Add inspection notes and status</div>
              <div className="feature-item">Visual color coding from database</div>
              <div className="feature-item">Export inspection data</div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .inspection-panel {
          flex: 0 0 auto;
          background: var(--color-white);
          border-left: var(--border-width) solid var(--color-gray-200);
          display: flex;
          flex-direction: column;
          min-width: 300px;
          max-width: 600px;
          overflow: hidden;
          position: relative;
        }

        .resize-handle {
          position: absolute;
          left: -3px;
          top: 0;
          bottom: 0;
          width: 6px;
          background: transparent;
          cursor: col-resize;
          z-index: 1000;
          transition: all 0.2s ease;
        }

        .resize-handle:hover {
          background: rgba(255, 102, 0, 0.3);
          left: -4px;
          width: 8px;
        }

        .resize-handle::after {
          content: '⋮⋮';
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%) rotate(90deg);
          font-size: 14px;
          color: var(--color-gray-400);
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .resize-handle:hover::after {
          opacity: 0.8;
          color: var(--color-primary);
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-lg);
          border-bottom: var(--border-width) solid var(--color-gray-200);
          background: var(--color-gray-50);
        }

        .header-left {
          display: flex;
          flex-direction: column;
          gap: var(--space-xs);
        }

        .panel-header h2 {
          font-size: var(--font-size-lg);
          font-weight: 600;
          color: var(--color-gray-900);
          margin: 0;
        }

        .connection-status {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          transition: background-color 0.2s ease;
        }

        .status-dot.online {
          background: var(--color-success);
        }

        .status-dot.offline {
          background: var(--color-error);
        }

        .status-text {
          font-size: var(--font-size-xs);
          color: var(--color-gray-600);
        }

        .project-id {
          font-size: var(--font-size-xs);
          color: var(--color-gray-500);
          font-family: monospace;
        }

        .header-actions {
          display: flex;
          gap: var(--space-sm);
        }

        .panel-content {
          flex: 1;
          padding: var(--space-md);
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
          overflow-y: auto;
          overflow-x: hidden;
          height: 0;
        }

        .card {
          background: var(--color-white);
          border-radius: var(--border-radius);
          border: var(--border-width) solid var(--color-gray-200);
          box-shadow: var(--shadow-sm);
          flex-shrink: 0;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-md);
          border-bottom: var(--border-width) solid var(--color-gray-200);
        }

        .card-body {
          padding: var(--space-md);
        }

        .card-footer {
          padding: var(--space-sm) var(--space-md);
          border-top: var(--border-width) solid var(--color-gray-200);
          background: var(--color-gray-50);
        }

        .card-header h3 {
          font-size: var(--font-size-base);
          font-weight: 600;
          color: var(--color-gray-900);
          margin: 0;
        }

        .loading-spinner-small {
          width: 16px;
          height: 16px;
          border: 2px solid var(--color-gray-200);
          border-top: 2px solid var(--color-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .element-name {
          font-size: var(--font-size-base);
          font-weight: 600;
          color: var(--color-primary);
          margin-bottom: var(--space-sm);
          padding: var(--space-sm);
          background: var(--color-gray-50);
          border-radius: var(--border-radius);
          line-height: 1.3;
        }

        .property-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-xs);
        }

        .property-item {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: var(--space-sm);
          padding: var(--space-xs) 0;
          border-bottom: var(--border-width) solid var(--color-gray-100);
          line-height: 1.3;
        }

        .property-item:last-child {
          border-bottom: none;
        }

        .property-key {
          font-weight: 500;
          color: var(--color-gray-600);
          min-width: 80px;
          flex-shrink: 0;
          text-transform: capitalize;
          font-size: var(--font-size-sm);
        }

        .property-value {
          color: var(--color-gray-900);
          text-align: right;
          word-break: break-word;
          font-size: var(--font-size-sm);
        }

        .property-id {
          font-family: monospace;
          background: var(--color-gray-100);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: var(--font-size-xs);
        }

        .form-container {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: var(--space-xs);
        }

        .form-group-full {
          width: 100%;
        }

        .form-label {
          font-size: var(--font-size-sm);
          font-weight: 600;
          color: var(--color-gray-700);
          margin-bottom: 2px;
          line-height: 1.2;
        }

        .form-input,
        .form-textarea {
          width: 100%;
          padding: var(--space-sm);
          border: 2px solid var(--color-gray-200);
          border-radius: var(--border-radius);
          font-size: var(--font-size-sm);
          background: var(--color-white);
          color: var(--color-gray-900);
          transition: all 0.2s ease;
          line-height: 1.3;
        }

        .form-input:focus,
        .form-textarea:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(255, 102, 0, 0.1);
        }

        .form-input:disabled,
        .form-textarea:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .form-textarea {
          resize: vertical;
          min-height: 60px;
          line-height: 1.4;
        }

        .status-select-wrapper {
          position: relative;
          width: 100%;
        }

        .status-select {
          width: 100%;
          padding: var(--space-sm);
          border: 2px solid var(--color-gray-200);
          border-radius: var(--border-radius);
          font-size: var(--font-size-sm);
          background: var(--color-white);
          color: var(--color-gray-900);
          cursor: pointer;
          transition: all 0.2s ease;
          appearance: none;
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23666' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
          background-position: right var(--space-sm) center;
          background-repeat: no-repeat;
          background-size: 0.875rem;
          padding-right: 2.5rem;
          line-height: 1.3;
        }

        .status-select:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(255, 102, 0, 0.1);
        }

        .status-select:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .status-select.status-ok {
          border-color: var(--color-success);
          background-color: #f0fdf4;
        }

        .status-select.status-issue {
          border-color: var(--color-error);
          background-color: #fef2f2;
        }

        .status-preview {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          margin-top: var(--space-sm);
          padding: var(--space-sm);
          background: var(--color-gray-50);
          border-radius: var(--border-radius);
          font-size: var(--font-size-xs);
          border: var(--border-width) solid var(--color-gray-200);
          line-height: 1.3;
        }

        .status-indicator {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .auto-save-note {
          font-size: var(--font-size-xs);
          text-align: center;
          line-height: 1.2;
          transition: color 0.2s ease;
        }

        .welcome-state {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-lg);
          overflow-y: auto;
        }

        .welcome-content {
          text-align: center;
          max-width: 280px;
        }

        .welcome-icon {
          width: 40px;
          height: 40px;
          margin: 0 auto var(--space-md);
          color: var(--color-gray-400);
        }

        .welcome-content h3 {
          font-size: var(--font-size-base);
          font-weight: 600;
          color: var(--color-gray-900);
          margin: 0 0 var(--space-sm) 0;
          line-height: 1.3;
        }

        .welcome-content p {
          color: var(--color-gray-600);
          margin-bottom: var(--space-md);
          line-height: 1.4;
          font-size: var(--font-size-sm);
        }

        .feature-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-xs);
        }

        .feature-item {
          padding: var(--space-xs);
          background: var(--color-gray-50);
          border-radius: var(--border-radius);
          font-size: var(--font-size-xs);
          color: var(--color-gray-700);
          line-height: 1.3;
        }

        /* Mobile Styles */
        @media (max-width: 768px) {
          .inspection-panel {
            flex: 1;
            min-width: unset;
            max-width: unset;
            order: 2;
            width: 100% !important;
          }

          .resize-handle {
            display: none;
          }

          .panel-header {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--space-sm);
          }

          .header-left {
            width: 100%;
          }

          .header-actions {
            width: 100%;
            justify-content: flex-end;
          }

          .form-container {
            gap: var(--space-sm);
          }

          .property-item {
            flex-direction: column;
            gap: var(--space-xs);
            align-items: flex-start;
          }

          .property-value {
            text-align: left;
          }

          .welcome-state {
            padding: var(--space-md);
          }
        }

        /* Custom scrollbar */
        .panel-content::-webkit-scrollbar {
          width: 6px;
        }

        .panel-content::-webkit-scrollbar-track {
          background: var(--color-gray-100);
        }

        .panel-content::-webkit-scrollbar-thumb {
          background: var(--color-gray-400);
          border-radius: 3px;
        }

        .panel-content::-webkit-scrollbar-thumb:hover {
          background: var(--color-gray-500);
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}