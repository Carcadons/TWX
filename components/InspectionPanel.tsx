"use client";
import { useState, useEffect, useRef } from "react";

interface SelectedElement {
  id: string;
  name: string;
  type: string;
  properties: Record<string, any>;
}

interface InspectionPanelProps {
  selectedElement: SelectedElement | null;
  onInspectionChange: () => void;
}

interface InspectionData {
  inspector: string;
  status: string;
  notes: string;
  date: string;
  timestamp: string;
}

export default function InspectionPanel({ selectedElement, onInspectionChange }: InspectionPanelProps) {
  const [formData, setFormData] = useState<InspectionData>({
    inspector: "",
    status: "",
    notes: "",
    date: new Date().toISOString().split('T')[0],
    timestamp: ""
  });

  const [panelWidth, setPanelWidth] = useState(380);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);

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

  // Debug: Log props received
  useEffect(() => {
    console.log("🔍 InspectionPanel props:", { selectedElement, onInspectionChange });
  }, [selectedElement, onInspectionChange]);

  // Load inspection data when element changes
  useEffect(() => {
    console.log("🔍 InspectionPanel selectedElement changed:", selectedElement);

    if (selectedElement) {
      const stored = localStorage.getItem(`inspection-${selectedElement.id}`);
      if (stored) {
        try {
          const parsedData = JSON.parse(stored);
          console.log("🔍 Loaded stored inspection data:", parsedData);
          setFormData(parsedData);
        } catch (e) {
          console.warn("Failed to parse stored inspection data:", e);
        }
      } else {
        console.log("🔍 No stored data, using defaults");
        setFormData({
          inspector: "",
          status: "",
          notes: "",
          date: new Date().toISOString().split('T')[0],
          timestamp: ""
        });
      }
    }
  }, [selectedElement]);

  // Save inspection data
  const saveInspection = (data: InspectionData) => {
    if (!selectedElement) return;

    const inspectionData = {
      ...data,
      timestamp: new Date().toISOString()
    };

    console.log("💾 Saving inspection data:", inspectionData);

    localStorage.setItem(`inspection-${selectedElement.id}`, JSON.stringify(inspectionData));

    const allInspections = JSON.parse(localStorage.getItem('all-inspections') || '{}');
    allInspections[selectedElement.id] = inspectionData;
    localStorage.setItem('all-inspections', JSON.stringify(allInspections));

    console.log("💾 Calling onInspectionChange");
    onInspectionChange();
  };

  const updateField = (field: keyof InspectionData, value: string) => {
    const newData = { ...formData, [field]: value };
    console.log("📝 Updating field:", field, "to:", value);
    setFormData(newData);

    if (selectedElement && (newData.inspector || newData.status || newData.notes)) {
      saveInspection(newData);
    }
  };

  const clearInspection = () => {
    if (!selectedElement) return;

    const clearedData = {
      inspector: "",
      status: "",
      notes: "",
      date: new Date().toISOString().split('T')[0],
      timestamp: ""
    };

    setFormData(clearedData);
    localStorage.removeItem(`inspection-${selectedElement.id}`);

    const allInspections = JSON.parse(localStorage.getItem('all-inspections') || '{}');
    delete allInspections[selectedElement.id];
    localStorage.setItem('all-inspections', JSON.stringify(allInspections));

    onInspectionChange();
  };

  const exportAllData = () => {
    const allInspections = JSON.parse(localStorage.getItem('all-inspections') || '{}');

    const exportData = {
      projectName: "TWX Inspection Project",
      exportDate: new Date().toISOString(),
      totalInspections: Object.keys(allInspections).length,
      inspections: allInspections
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `twx-inspections-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ok": return "var(--color-success)";
      case "issue": return "var(--color-error)";
      default: return "var(--color-gray-400)";
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
        ref={resizeRef}
        className="resize-handle"
        onMouseDown={handleResizeStart}
      />

      {/* Header */}
      <div className="panel-header">
        <h2>BIM Inspection</h2>
        <button onClick={exportAllData} className="btn btn-sm btn-secondary">
          Export
        </button>
      </div>

      {selectedElement ? (
        <div className="panel-content">
          {/* Element Info */}
          <div className="card">
            <div className="card-header">
              <h3>Element Details</h3>
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
                  />
                </div>

                {/* Notes Field - Full Width */}
                <div className="form-group form-group-full">
                  <label className="form-label">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => updateField('notes', e.target.value)}
                    placeholder="Add inspection notes..."
                    rows={3}
                    className="form-textarea"
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

            {/* Auto-save note */}
            <div className="card-footer">
              <div className="auto-save-note">
                Auto-saved locally
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
              <div className="feature-item">Click elements to see BIM properties</div>
              <div className="feature-item">Add inspection notes and status</div>
              <div className="feature-item">Visual color coding</div>
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

        /* Custom JavaScript-based resize handle */
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

        /* Resize indicator dots */
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

        /* Hide any browser default resize handles */
        .inspection-panel::-webkit-resizer {
          display: none;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-lg);
          border-bottom: var(--border-width) solid var(--color-gray-200);
          background: var(--color-gray-50);
        }

        .panel-header h2 {
          font-size: var(--font-size-lg);
          font-weight: 600;
          color: var(--color-gray-900);
          margin: 0;
        }

        .panel-content {
          flex: 1;
          padding: var(--space-md);
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
          overflow-y: auto;
          overflow-x: hidden;
          height: 0; /* Forces flex child to respect scroll */
        }

        .card {
          background: var(--color-white);
          border-radius: var(--border-radius);
          border: var(--border-width) solid var(--color-gray-200);
          box-shadow: var(--shadow-sm);
          flex-shrink: 0; /* Prevent cards from shrinking */
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

        /* IMPROVED FORM STYLING - More Compact */
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

        .form-textarea {
          resize: vertical;
          min-height: 60px;
          line-height: 1.4;
        }

        /* STATUS SELECT IMPROVEMENTS */
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

        .status-select.status-ok {
          border-color: var(--color-success);
          background-color: #f0fdf4;
        }

        .status-select.status-issue {
          border-color: var(--color-error);
          background-color: #fef2f2;
        }

        .status-select option {
          padding: var(--space-xs);
          font-size: var(--font-size-sm);
          background: var(--color-white);
          color: var(--color-gray-900);
          line-height: 1.3;
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
          color: var(--color-gray-500);
          text-align: center;
          line-height: 1.2;
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
      `}</style>
    </div>
  );
}