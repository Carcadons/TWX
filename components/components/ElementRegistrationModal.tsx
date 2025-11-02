import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { COMMON_IFC_TYPES, CONDITION_TYPES } from '../shared/constants';

interface ElementRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  speckleElementId?: string;
  speckleElementName?: string;
  speckleElementType?: string;
  speckleElementProperties?: Record<string, any>;
  onElementRegistered: (element: any) => void;
  embedded?: boolean;
}

export default function ElementRegistrationModal({
  isOpen,
  onClose,
  projectId,
  speckleElementId,
  speckleElementName,
  speckleElementType,
  speckleElementProperties,
  onElementRegistered,
  embedded = false,
}: ElementRegistrationModalProps) {
  // Extract length from properties (could be Length, length, or other similar property)
  const extractLength = (props?: Record<string, any>): string => {
    if (!props) return '';
    // Try different common property names for length
    const lengthValue = props.Length || props.length || props.HEIGHT || props.height || '';
    return lengthValue ? String(lengthValue) : '';
  };

  const [formData, setFormData] = useState({
    ifcType: speckleElementProperties?.ifcType || 'IfcBuildingElementProxy',
    elementName: speckleElementName || '',
    length: extractLength(speckleElementProperties),
    currentCondition: 'Good',
    remarks: '',
  });

  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'form' | 'preview'>('form');
  const [registeredElement, setRegisteredElement] = useState<any>(null);
  const [checkingExisting, setCheckingExisting] = useState(false);
  const [existingAsset, setExistingAsset] = useState<any>(null);

  // Update form data when props change (element selection changes)
  useEffect(() => {
    if (isOpen) {
      setFormData({
        ifcType: speckleElementProperties?.ifcType || 'IfcBuildingElementProxy',
        elementName: speckleElementName || '',
        length: extractLength(speckleElementProperties),
        currentCondition: 'Good',
        remarks: '',
      });
    }
  }, [isOpen, speckleElementProperties?.ifcType, speckleElementName, speckleElementProperties]);

  // Check if element is already linked when modal opens
  useEffect(() => {
    if (isOpen && speckleElementId) {
      checkExistingLink();
    }
  }, [isOpen, speckleElementId]);

  const checkExistingLink = async () => {
    // Always clear state first, even if we're not checking
    setExistingAsset(null);
    setError(null);
    
    if (!speckleElementId) {
      setCheckingExisting(false);
      return;
    }

    setCheckingExisting(true);
    
    try {
      const response = await fetch(`/api/elements/check-linking/${speckleElementId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.linked) {
          setExistingAsset(data.asset);
          setError(`This element is already linked to asset ${data.asset.assetNumber}. Each BIM element can only be linked to one asset.`);
        } else {
          setExistingAsset(null);
          setError(null);
        }
      } else {
        setExistingAsset(null);
        setError(null);
      }
    } catch (err) {
      console.error('Error checking existing link:', err);
      setExistingAsset(null);
      setError(null);
    } finally {
      setCheckingExisting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGeneratePreview = async () => {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/elements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ifcType: formData.ifcType,
          description: formData.elementName,
          specifications: formData.length ? { length: formData.length } : {},
          currentCondition: formData.currentCondition,
          currentProjectId: projectId,
          remarks: formData.remarks,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to register element');
      }

      const element = await response.json();
      setRegisteredElement(element);

      const qrData = `https://${process.env.NEXT_PUBLIC_REPLIT_DOMAINS || window.location.host}/asset/${element.qrCode}`;
      const qrUrl = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
      });
      setQrCodeUrl(qrUrl);

      if (speckleElementId) {
        await fetch(`/api/elements/${element.id}/link`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            speckleElementId,
            notes: `Initial linking during registration`,
          }),
        });
      }

      setStep('preview');
      onElementRegistered(element);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register element');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadQR = () => {
    if (!qrCodeUrl) return;
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `${registeredElement?.assetNumber}-QR.png`;
    link.click();
  };

  const handleReset = () => {
    setFormData({
      ifcType: speckleElementProperties?.ifcType || 'IfcBuildingElementProxy',
      elementName: speckleElementName || '',
      length: extractLength(speckleElementProperties),
      currentCondition: 'Good',
      remarks: '',
    });
    setQrCodeUrl('');
    setRegisteredElement(null);
    setStep('form');
    setError(null);
    setExistingAsset(null);
    setCheckingExisting(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  if (!isOpen) return null;

  const formContent = (
    <>
      {step === 'form' ? (
        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}

          <div className="form-section">
            <div className="info-box">
              <strong>✨ Asset Number:</strong> Will be auto-generated as <strong>{formData.ifcType}-XXXXXX</strong>
            </div>

            <div className="form-group">
              <label>IFC Type (from BIM element)</label>
              <input
                type="text"
                value={formData.ifcType}
                disabled
                className="disabled-input"
              />
            </div>

            <div className="form-group">
              <label>Element Name *</label>
              <input
                type="text"
                value={formData.elementName}
                onChange={(e) => handleInputChange('elementName', e.target.value)}
                placeholder="Element name"
                required
              />
            </div>

            <div className="form-group">
              <label>Length (m)</label>
              <input
                type="text"
                value={formData.length}
                onChange={(e) => handleInputChange('length', e.target.value)}
                placeholder="e.g., 3.5"
              />
            </div>

            <div className="form-group">
              <label>Current Condition *</label>
              <select
                value={formData.currentCondition}
                onChange={(e) => handleInputChange('currentCondition', e.target.value)}
                required
              >
                {CONDITION_TYPES.map(condition => (
                  <option key={condition} value={condition}>{condition}</option>
                ))}
              </select>
            </div>

            <div className="form-group full-width">
              <label>Remarks (optional)</label>
              <textarea
                value={formData.remarks}
                onChange={(e) => handleInputChange('remarks', e.target.value)}
                placeholder="Additional notes or comments"
                rows={3}
              />
            </div>
          </div>
        </div>
        ) : (
          <div className="modal-body preview-step">
            <div className="success-message">
              ✅ Asset registered successfully!
            </div>

            <div className="qr-code-section">
              <h3>Asset Number: {registeredElement?.assetNumber}</h3>
              {qrCodeUrl && (
                <div className="qr-code-container">
                  <img src={qrCodeUrl} alt="QR Code" />
                  <p>Scan this QR code to link this asset in other projects</p>
                </div>
              )}
            </div>

            <div className="asset-summary">
              <h4>Asset Details</h4>
              <table>
                <tbody>
                  <tr>
                    <td><strong>Asset Number:</strong></td>
                    <td>{registeredElement?.assetNumber}</td>
                  </tr>
                  <tr>
                    <td><strong>IFC Type:</strong></td>
                    <td>{registeredElement?.ifcType}</td>
                  </tr>
                  <tr>
                    <td><strong>Element Name:</strong></td>
                    <td>{registeredElement?.description}</td>
                  </tr>
                  {registeredElement?.specifications?.length && (
                    <tr>
                      <td><strong>Length:</strong></td>
                      <td>{registeredElement.specifications.length} m</td>
                    </tr>
                  )}
                  <tr>
                    <td><strong>Condition:</strong></td>
                    <td>{registeredElement?.currentCondition}</td>
                  </tr>
                  {registeredElement?.remarks && (
                    <tr>
                      <td><strong>Remarks:</strong></td>
                      <td>{registeredElement.remarks}</td>
                    </tr>
                  )}
                  <tr>
                    <td><strong>Status:</strong></td>
                    <td className="status-badge">{registeredElement?.status}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="modal-footer">
          {step === 'form' ? (
            <>
              <button className="btn-secondary" onClick={handleClose}>Cancel</button>
              <button 
                className="btn-primary" 
                onClick={handleGeneratePreview}
                disabled={loading || checkingExisting || existingAsset || !formData.ifcType || !formData.currentCondition || !formData.elementName}
              >
                {checkingExisting ? 'Checking...' : loading ? 'Registering...' : existingAsset ? 'Already Linked' : 'Register Asset'}
              </button>
            </>
          ) : (
            <>
              <button className="btn-secondary" onClick={handleDownloadQR}>
                Download QR Code
              </button>
              <button className="btn-primary" onClick={handleClose}>
                Done
              </button>
            </>
          )}
        </div>

        <style jsx>{`
          .element-registration-modal {
            max-width: 800px;
            max-height: 90vh;
            overflow-y: auto;
          }

          .form-section {
            display: flex;
            flex-direction: column;
            gap: var(--space-md);
          }

          .form-group {
            display: flex;
            flex-direction: column;
          }

          .form-group.full-width {
            width: 100%;
          }

          .form-group label {
            font-weight: 600;
            margin-bottom: var(--space-xs);
            color: var(--color-text-primary);
            font-size: var(--font-size-sm);
          }

          .form-group input,
          .form-group select,
          .form-group textarea {
            padding: var(--space-sm);
            border: 1px solid var(--color-border);
            border-radius: var(--border-radius);
            font-size: var(--font-size-md);
            font-family: inherit;
          }

          .form-group input.disabled-input {
            background-color: #f5f5f5;
            color: #666;
            cursor: not-allowed;
          }

          .info-box {
            background: #e8f4fd;
            border-left: 4px solid #2196F3;
            padding: var(--space-md);
            border-radius: var(--border-radius);
            margin-bottom: var(--space-sm);
          }

          .specifications-section h3 {
            margin-top: 0;
            margin-bottom: var(--space-md);
          }

          .info-box {
            background: var(--color-primary-light);
            padding: var(--space-md);
            border-radius: var(--border-radius);
            border-left: 3px solid var(--color-primary);
          }

          .info-box p {
            margin: var(--space-xs) 0 0 0;
            font-size: var(--font-size-sm);
          }

          .qr-code-container {
            text-align: center;
            padding: var(--space-lg);
            background: white;
            border-radius: var(--border-radius);
            margin: var(--space-lg) 0;
          }

          .qr-code-container img {
            max-width: 300px;
            width: 100%;
            height: auto;
          }

          .asset-summary table {
            width: 100%;
            border-collapse: collapse;
          }

          .asset-summary td {
            padding: var(--space-sm);
            border-bottom: 1px solid var(--color-border);
          }

          .status-badge {
            display: inline-block;
            padding: var(--space-xs) var(--space-sm);
            background: var(--color-success);
            color: white;
            border-radius: var(--border-radius);
            text-transform: capitalize;
          }

          .preview-step {
            min-height: 400px;
          }

          @media (max-width: 768px) {
            .form-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
    </>
  );

  if (embedded) {
    return formContent;
  }

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content element-registration-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Register New Asset</h2>
          <button className="close-button" onClick={handleClose}>×</button>
        </div>
        {formContent}
      </div>
    </div>
  );
}
