import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import TopBar from '../components/TopBar';
import ElementHistoryPanel from '../components/ElementHistoryPanel';
import { useAuth } from '../hooks/useAuth';
import jsPDF from 'jspdf';

export default function AssetsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  
  const [elements, setElements] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [filters, setFilters] = useState({
    projectId: '',
    status: '',
    ifcType: '',
    searchTerm: '',
  });

  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [expandedElement, setExpandedElement] = useState<string | null>(null);
  const [elementDetails, setElementDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [elementsRes, projectsRes] = await Promise.all([
        fetch('/api/elements'),
        fetch('/api/projects'),
      ]);

      if (!elementsRes.ok || !projectsRes.ok) {
        throw new Error('Failed to load data');
      }

      const [elementsData, projectsData] = await Promise.all([
        elementsRes.json(),
        projectsRes.json(),
      ]);

      setElements(elementsData);
      setProjects(projectsData.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const getFilteredElements = () => {
    return elements.filter(element => {
      if (filters.projectId && element.currentProjectId !== filters.projectId) {
        return false;
      }
      if (filters.status && element.status !== filters.status) {
        return false;
      }
      if (filters.ifcType && element.ifcType !== filters.ifcType) {
        return false;
      }
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        return (
          element.assetNumber.toLowerCase().includes(searchLower) ||
          element.description?.toLowerCase().includes(searchLower) ||
          element.serialNumber?.toLowerCase().includes(searchLower)
        );
      }
      return true;
    });
  };

  const uniqueIfcTypes = Array.from(new Set(elements.map(e => e.ifcType))).sort();
  const filteredElements = getFilteredElements();

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : projectId;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'in_transit': return '#f59e0b';
      case 'in_storage': return '#6b7280';
      case 'retired': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const handleExpandElement = async (elementId: string) => {
    if (expandedElement === elementId) {
      setExpandedElement(null);
      setElementDetails(null);
      return;
    }

    setExpandedElement(elementId);
    setLoadingDetails(true);
    setElementDetails(null);

    try {
      const response = await fetch(`/api/elements/${elementId}/details`);
      if (response.ok) {
        const data = await response.json();
        setElementDetails(data);
      } else {
        console.error('Failed to load element details');
      }
    } catch (error) {
      console.error('Error loading element details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleExportPDF = async (element: any) => {
    try {
      // Fetch full details if not already loaded
      let details = elementDetails;
      if (expandedElement !== element.id) {
        const response = await fetch(`/api/elements/${element.id}/details`);
        if (response.ok) {
          details = await response.json();
        } else {
          throw new Error('Failed to load element details');
        }
      }

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPos = 20;

      // Title
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Asset Information', pageWidth / 2, yPos, { align: 'center' });
      yPos += 15;

      // Asset Number (large and prominent)
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(`Asset: ${element.assetNumber}`, 20, yPos);
      yPos += 10;

      // Basic Information
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      
      const info = [
        ['IFC Type:', element.ifcType],
        ['Description:', element.description || '-'],
        ['Status:', element.status],
        ['Condition:', element.currentCondition],
        ['Current Project:', element.currentProjectId ? getProjectName(element.currentProjectId) : '-'],
        ['Serial Number:', element.serialNumber || '-'],
        ['Manufacturer:', element.manufacturer || '-'],
        ['Length:', element.length ? `${element.length} mm` : '-'],
      ];

      info.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, 20, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(String(value), 65, yPos);
        yPos += 7;
      });

      yPos += 5;

      // QR Code
      if (details?.qrCodeDataUrl) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('QR Code', 20, yPos);
        yPos += 10;

        // Add QR code image
        const qrSize = 60;
        doc.addImage(details.qrCodeDataUrl, 'PNG', 20, yPos, qrSize, qrSize);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(details.element.qrCode, 20, yPos + qrSize + 5);
        yPos += qrSize + 15;
      }

      // Linked BIM Elements
      if (details?.mappings && details.mappings.length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`Linked BIM Elements (${details.mappings.length})`, 20, yPos);
        yPos += 10;

        doc.setFontSize(10);
        details.mappings.forEach((mapping: any, index: number) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }

          doc.setFont('helvetica', 'bold');
          doc.text(`${index + 1}. ${mapping.projectName || mapping.projectId}`, 25, yPos);
          yPos += 6;

          doc.setFont('helvetica', 'normal');
          doc.text(`   Element ID: ${mapping.speckleElementId}`, 25, yPos);
          yPos += 6;

          if (mapping.notes) {
            doc.text(`   Notes: ${mapping.notes}`, 25, yPos);
            yPos += 6;
          }

          if (!mapping.isActive) {
            doc.setTextColor(150, 150, 150);
            doc.text('   (Inactive)', 25, yPos);
            doc.setTextColor(0, 0, 0);
            yPos += 6;
          }

          yPos += 3;
        });
        yPos += 5;
      }

      // Inspection Summary
      if (details?.inspections && details.inspections.length > 0) {
        if (yPos > 240) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`Inspection History (${details.inspections.length})`, 20, yPos);
        yPos += 10;

        doc.setFontSize(10);
        details.inspections.slice(0, 10).forEach((inspection: any, index: number) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }

          doc.setFont('helvetica', 'bold');
          doc.text(`${index + 1}. ${inspection.date}`, 25, yPos);
          yPos += 6;

          doc.setFont('helvetica', 'normal');
          doc.text(`   Inspector: ${inspection.inspector}`, 25, yPos);
          yPos += 6;
          doc.text(`   Status: ${inspection.status}`, 25, yPos);
          yPos += 6;

          if (inspection.notes) {
            const notes = inspection.notes.length > 60 
              ? inspection.notes.substring(0, 60) + '...'
              : inspection.notes;
            doc.text(`   Notes: ${notes}`, 25, yPos);
            yPos += 6;
          }

          yPos += 3;
        });

        if (details.inspections.length > 10) {
          doc.setFont('helvetica', 'italic');
          doc.text(`... and ${details.inspections.length - 10} more inspections`, 25, yPos);
        }
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(128, 128, 128);
        doc.text(
          `TWX Asset Report - Generated ${new Date().toLocaleDateString()} - Page ${i} of ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      // Save the PDF
      doc.save(`TWX-Asset-${element.assetNumber}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  if (authLoading || !user) {
    return null;
  }

  return (
    <div className="page-container">
      <TopBar showBackTo3D={true} />
      
      <div className="assets-page">
        <header className="page-header">
          <div>
            <h1>Asset Inventory</h1>
            <p className="page-subtitle">
              Manage all physical temporary works elements across projects
            </p>
          </div>
          <div className="header-stats">
            <div className="stat-card">
              <div className="stat-value">{elements.length}</div>
              <div className="stat-label">Total Assets</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {elements.filter(e => e.status === 'active').length}
              </div>
              <div className="stat-label">Active</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {elements.filter(e => e.status === 'in_transit').length}
              </div>
              <div className="stat-label">In Transit</div>
            </div>
          </div>
        </header>

        <div className="filters-bar">
          <div className="filter-group">
            <label>Project:</label>
            <select
              value={filters.projectId}
              onChange={(e) => handleFilterChange('projectId', e.target.value)}
            >
              <option value="">All Projects</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Status:</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="in_transit">In Transit</option>
              <option value="in_storage">In Storage</option>
              <option value="retired">Retired</option>
            </select>
          </div>

          <div className="filter-group">
            <label>IFC Type:</label>
            <select
              value={filters.ifcType}
              onChange={(e) => handleFilterChange('ifcType', e.target.value)}
            >
              <option value="">All Types</option>
              {uniqueIfcTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="filter-group search-group">
            <label>Search:</label>
            <input
              type="text"
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              placeholder="Asset number, description, serial..."
            />
          </div>

          {(filters.projectId || filters.status || filters.ifcType || filters.searchTerm) && (
            <button
              className="clear-filters-btn"
              onClick={() => setFilters({ projectId: '', status: '', ifcType: '', searchTerm: '' })}
            >
              Clear Filters
            </button>
          )}
        </div>

        {loading ? (
          <div className="loading-state">Loading assets...</div>
        ) : error ? (
          <div className="error-state">{error}</div>
        ) : filteredElements.length === 0 ? (
          <div className="empty-state">
            <p>No assets found matching your filters</p>
          </div>
        ) : (
          <div className="assets-table-container">
            <table className="assets-table">
              <thead>
                <tr>
                  <th>Asset Number</th>
                  <th>IFC Type</th>
                  <th>Description</th>
                  <th>Current Project</th>
                  <th>Status</th>
                  <th>Condition</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredElements.map(element => (
                  <>
                    <tr key={element.id} className={expandedElement === element.id ? 'expanded-row' : ''}>
                      <td>
                        <strong>{element.assetNumber}</strong>
                        {element.serialNumber && (
                          <div className="serial-number">S/N: {element.serialNumber}</div>
                        )}
                      </td>
                      <td className="ifc-type">{element.ifcType}</td>
                      <td className="description">{element.description || '-'}</td>
                      <td>
                        {element.currentProjectId 
                          ? getProjectName(element.currentProjectId)
                          : '-'}
                      </td>
                      <td>
                        <span
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(element.status) }}
                        >
                          {element.status}
                        </span>
                      </td>
                      <td>{element.currentCondition}</td>
                      <td className="actions-cell">
                        <button
                          className="action-btn expand-btn"
                          onClick={() => handleExpandElement(element.id)}
                          title={expandedElement === element.id ? "Collapse Details" : "View Details"}
                        >
                          {expandedElement === element.id ? '▼' : '▶'} Details
                        </button>
                        <button
                          className="action-btn"
                          onClick={() => setSelectedElement(element.id)}
                          title="View History"
                        >
                          📜 History
                        </button>
                        <button
                          className="action-btn"
                          onClick={() => handleExportPDF(element)}
                          title="Export to PDF"
                        >
                          📄 PDF
                        </button>
                      </td>
                    </tr>
                    {expandedElement === element.id && (
                      <tr key={`${element.id}-details`} className="details-row">
                        <td colSpan={7}>
                          {loadingDetails ? (
                            <div className="details-loading">Loading details...</div>
                          ) : elementDetails ? (
                            <div className="details-container">
                              <div className="details-section">
                                <h4>QR Code</h4>
                                {elementDetails.qrCodeDataUrl ? (
                                  <div className="qr-code-container">
                                    <img src={elementDetails.qrCodeDataUrl} alt={`QR Code for ${element.assetNumber}`} />
                                    <div className="qr-code-text">{elementDetails.element.qrCode}</div>
                                  </div>
                                ) : (
                                  <p className="no-data">No QR code available</p>
                                )}
                              </div>

                              <div className="details-section">
                                <h4>Linked BIM Elements ({elementDetails.mappings.length})</h4>
                                {elementDetails.mappings.length > 0 ? (
                                  <div className="mappings-list">
                                    {elementDetails.mappings.map((mapping: any) => (
                                      <div key={mapping.id} className="mapping-item">
                                        <div className="mapping-header">
                                          <strong>{mapping.projectName || mapping.projectId}</strong>
                                          {!mapping.isActive && <span className="inactive-badge">Inactive</span>}
                                        </div>
                                        <div className="mapping-detail">
                                          Element ID: <code>{mapping.speckleElementId}</code>
                                        </div>
                                        {mapping.speckleObjectUrl && (
                                          <div className="mapping-detail">
                                            <a href={mapping.speckleObjectUrl} target="_blank" rel="noopener noreferrer">
                                              View in Speckle →
                                            </a>
                                          </div>
                                        )}
                                        {mapping.notes && (
                                          <div className="mapping-detail notes">{mapping.notes}</div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="no-data">No BIM elements linked yet</p>
                                )}
                              </div>

                              <div className="details-section">
                                <h4>Inspections ({elementDetails.inspections.length})</h4>
                                {elementDetails.inspections.length > 0 ? (
                                  <div className="inspections-list">
                                    {elementDetails.inspections.map((inspection: any) => (
                                      <div key={inspection.id} className="inspection-item">
                                        <div className="inspection-header">
                                          <span className="inspection-date">{inspection.date}</span>
                                          <span 
                                            className="inspection-status"
                                            style={{ backgroundColor: getStatusColor(inspection.status) }}
                                          >
                                            {inspection.status}
                                          </span>
                                        </div>
                                        <div className="inspection-detail">
                                          Inspector: {inspection.inspector}
                                        </div>
                                        {inspection.notes && (
                                          <div className="inspection-detail notes">{inspection.notes}</div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="no-data">No inspections recorded yet</p>
                                )}
                              </div>
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="results-count">
          Showing {filteredElements.length} of {elements.length} assets
        </div>
      </div>

      {selectedElement && (
        <div className="modal-overlay" onClick={() => setSelectedElement(null)}>
          <div className="modal-content-large" onClick={(e) => e.stopPropagation()}>
            <ElementHistoryPanel
              elementId={selectedElement}
              onClose={() => setSelectedElement(null)}
            />
          </div>
        </div>
      )}

      <style jsx>{`
        .page-container {
          min-height: 100vh;
          background: var(--color-bg-primary);
        }

        .assets-page {
          max-width: 1400px;
          margin: 0 auto;
          padding: calc(60px + var(--space-xl)) var(--space-xl) var(--space-xl) var(--space-xl);
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--space-xl);
        }

        .page-header h1 {
          margin: 0 0 var(--space-xs) 0;
          color: var(--color-text-primary);
        }

        .page-subtitle {
          margin: 0;
          color: var(--color-text-secondary);
          font-size: var(--font-size-md);
        }

        .header-stats {
          display: flex;
          gap: var(--space-md);
        }

        .stat-card {
          background: white;
          padding: var(--space-md);
          border-radius: var(--border-radius);
          box-shadow: var(--shadow-sm);
          text-align: center;
          min-width: 100px;
        }

        .stat-value {
          font-size: 32px;
          font-weight: 700;
          color: var(--color-primary);
          line-height: 1;
        }

        .stat-label {
          margin-top: var(--space-xs);
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .filters-bar {
          background: white;
          padding: var(--space-md);
          border-radius: var(--border-radius);
          box-shadow: var(--shadow-sm);
          margin-bottom: var(--space-lg);
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-md);
          align-items: flex-end;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          min-width: 150px;
        }

        .filter-group.search-group {
          flex: 1;
          min-width: 250px;
        }

        .filter-group label {
          font-size: var(--font-size-sm);
          font-weight: 600;
          margin-bottom: var(--space-xs);
          color: var(--color-text-secondary);
        }

        .filter-group select,
        .filter-group input {
          padding: var(--space-sm);
          border: 1px solid var(--color-border);
          border-radius: var(--border-radius);
          font-size: var(--font-size-md);
        }

        .clear-filters-btn {
          padding: var(--space-sm) var(--space-md);
          background: var(--color-text-secondary);
          color: white;
          border: none;
          border-radius: var(--border-radius);
          cursor: pointer;
          font-size: var(--font-size-sm);
        }

        .clear-filters-btn:hover {
          background: var(--color-text-primary);
        }

        .assets-table-container {
          background: white;
          border-radius: var(--border-radius);
          box-shadow: var(--shadow-sm);
          overflow-x: auto;
        }

        .assets-table {
          width: 100%;
          border-collapse: collapse;
        }

        .assets-table thead {
          background: var(--color-bg-secondary);
        }

        .assets-table th {
          padding: var(--space-md);
          text-align: left;
          font-weight: 600;
          color: var(--color-text-primary);
          font-size: var(--font-size-sm);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 2px solid var(--color-border);
        }

        .assets-table td {
          padding: var(--space-md);
          border-bottom: 1px solid var(--color-border);
          vertical-align: middle;
        }

        .assets-table tbody tr:hover {
          background: var(--color-bg-secondary);
        }

        .serial-number {
          font-size: var(--font-size-xs);
          color: var(--color-text-secondary);
          margin-top: var(--space-xs);
        }

        .ifc-type {
          font-family: monospace;
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }

        .description {
          max-width: 300px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: var(--border-radius);
          color: white;
          font-size: var(--font-size-xs);
          font-weight: 600;
          text-transform: capitalize;
        }

        .actions-cell {
          white-space: nowrap;
        }

        .action-btn {
          padding: 4px 8px;
          background: var(--color-primary);
          color: white;
          border: none;
          border-radius: var(--border-radius);
          cursor: pointer;
          font-size: var(--font-size-xs);
          margin-right: var(--space-xs);
        }

        .action-btn:hover {
          background: var(--color-primary-dark);
        }

        .action-btn.expand-btn {
          background: var(--color-primary);
          margin-right: var(--space-xs);
        }

        .action-btn.expand-btn:hover {
          background: var(--color-primary-dark);
        }

        .expanded-row {
          background: var(--color-bg-secondary);
        }

        .details-row td {
          padding: 0 !important;
          background: var(--color-bg-secondary);
        }

        .details-loading {
          padding: var(--space-xl);
          text-align: center;
          color: var(--color-text-secondary);
        }

        .details-container {
          padding: var(--space-lg);
          display: grid;
          grid-template-columns: auto 1fr 1fr;
          gap: var(--space-lg);
        }

        .details-section {
          background: white;
          padding: var(--space-md);
          border-radius: var(--border-radius);
        }

        .details-section h4 {
          margin: 0 0 var(--space-md) 0;
          color: var(--color-text-primary);
          font-size: var(--font-size-md);
          border-bottom: 2px solid var(--color-primary);
          padding-bottom: var(--space-xs);
        }

        .qr-code-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-sm);
        }

        .qr-code-container img {
          max-width: 200px;
          border: 2px solid var(--color-border);
          border-radius: var(--border-radius);
          padding: var(--space-sm);
        }

        .qr-code-text {
          font-family: monospace;
          font-size: var(--font-size-xs);
          color: var(--color-text-secondary);
          background: var(--color-bg-secondary);
          padding: var(--space-xs) var(--space-sm);
          border-radius: var(--border-radius);
        }

        .mappings-list,
        .inspections-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }

        .mapping-item,
        .inspection-item {
          padding: var(--space-sm);
          background: var(--color-bg-secondary);
          border-radius: var(--border-radius);
          border-left: 3px solid var(--color-primary);
        }

        .mapping-header,
        .inspection-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-xs);
        }

        .mapping-header strong {
          color: var(--color-text-primary);
        }

        .inactive-badge {
          background: var(--color-text-secondary);
          color: white;
          padding: 2px 6px;
          border-radius: var(--border-radius);
          font-size: var(--font-size-xs);
        }

        .mapping-detail,
        .inspection-detail {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          margin-top: var(--space-xs);
        }

        .mapping-detail code {
          background: white;
          padding: 2px 6px;
          border-radius: var(--border-radius);
          font-size: var(--font-size-xs);
          color: var(--color-primary);
        }

        .mapping-detail a {
          color: var(--color-primary);
          text-decoration: none;
        }

        .mapping-detail a:hover {
          text-decoration: underline;
        }

        .mapping-detail.notes,
        .inspection-detail.notes {
          font-style: italic;
          background: white;
          padding: var(--space-xs);
          border-radius: var(--border-radius);
        }

        .inspection-date {
          font-weight: 600;
          color: var(--color-text-primary);
        }

        .inspection-status {
          display: inline-block;
          padding: 2px 6px;
          border-radius: var(--border-radius);
          color: white;
          font-size: var(--font-size-xs);
          font-weight: 600;
          text-transform: capitalize;
        }

        .no-data {
          color: var(--color-text-secondary);
          font-style: italic;
          margin: var(--space-md) 0;
        }

        .results-count {
          margin-top: var(--space-md);
          text-align: center;
          color: var(--color-text-secondary);
          font-size: var(--font-size-sm);
        }

        .loading-state,
        .error-state,
        .empty-state {
          text-align: center;
          padding: var(--space-xl);
          background: white;
          border-radius: var(--border-radius);
          box-shadow: var(--shadow-sm);
        }

        .error-state {
          color: var(--color-error);
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: var(--space-lg);
        }

        .modal-content-large {
          background: white;
          border-radius: var(--border-radius);
          max-width: 1000px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
        }

        @media (max-width: 768px) {
          .assets-page {
            padding: var(--space-md);
          }

          .page-header {
            flex-direction: column;
            gap: var(--space-md);
          }

          .header-stats {
            width: 100%;
            justify-content: space-between;
          }

          .stat-card {
            flex: 1;
            min-width: auto;
          }

          .filters-bar {
            flex-direction: column;
          }

          .filter-group {
            width: 100%;
          }

          .details-container {
            grid-template-columns: 1fr;
          }

          .action-btn {
            font-size: var(--font-size-xs);
            padding: 2px 6px;
          }
        }
      `}</style>
    </div>
  );
}
