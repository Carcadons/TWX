import { useState, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface ElementLinkingModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  speckleElementId: string;
  speckleElementName?: string;
  onElementLinked: (element: any) => void;
  embedded?: boolean;
}

export default function ElementLinkingModal({
  isOpen,
  onClose,
  projectId,
  speckleElementId,
  speckleElementName,
  onElementLinked,
  embedded = false,
}: ElementLinkingModalProps) {
  const [mode, setMode] = useState<'manual' | 'scan'>('manual');
  const [assetNumber, setAssetNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanner, setScanner] = useState<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [element, setElement] = useState<any>(null);
  const [step, setStep] = useState<'input' | 'confirm' | 'success'>('input');

  useEffect(() => {
    if (isOpen && mode === 'scan' && !isScanning) {
      startScanner();
    }

    return () => {
      if (scanner && isScanning) {
        scanner.stop().catch(console.error);
      }
    };
  }, [isOpen, mode]);

  const startScanner = async () => {
    try {
      const html5QrCode = new Html5Qrcode('qr-reader');
      setScanner(html5QrCode);
      setIsScanning(true);

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          handleQRCodeScanned(decodedText);
        },
        (errorMessage) => {
        }
      );
    } catch (err) {
      setError('Unable to access camera. Please ensure camera permissions are granted.');
      setMode('manual');
    }
  };

  const stopScanner = async () => {
    if (scanner && isScanning) {
      try {
        await scanner.stop();
        setIsScanning(false);
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
  };

  const handleQRCodeScanned = async (qrCode: string) => {
    await stopScanner();
    
    const qrCodeMatch = qrCode.match(/TWX-ASSET-(.+)$/);
    if (qrCodeMatch) {
      const extractedAssetNumber = qrCodeMatch[1];
      setAssetNumber(extractedAssetNumber);
      await lookupElement(qrCodeMatch[0]);
    } else {
      setError('Invalid QR code format. Expected TWX asset QR code.');
    }
  };

  const lookupElement = async (qrCode: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/elements/qr/${encodeURIComponent(qrCode)}`);
      
      if (!response.ok) {
        throw new Error('Element not found. Please check the QR code or asset number.');
      }

      const foundElement = await response.json();
      setElement(foundElement);
      setStep('confirm');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to find element');
    } finally {
      setLoading(false);
    }
  };

  const handleManualLookup = async () => {
    if (!assetNumber) {
      setError('Please enter an asset number');
      return;
    }

    const qrCode = `TWX-ASSET-${assetNumber}`;
    await lookupElement(qrCode);
  };

  const handleInitiateTransfer = () => {
    // Open transfer workflow - for now, show helpful message
    setError(
      `To transfer this asset from Project ${element?.currentProjectId} to this project, ` +
      `go to Project ${element?.currentProjectId}, select the linked element, and use the Transfer option in the Inspection Panel.`
    );
  };

  const handleConfirmLink = async () => {
    if (!element) return;

    setLoading(true);
    setError(null);

    try {
      if (element.status !== 'active' && element.status !== 'in_transit') {
        throw new Error(`Element cannot be linked. Current status: ${element.status}`);
      }

      // Check if element is active in a different project
      if (element.currentProjectId && element.currentProjectId !== projectId && element.status === 'active') {
        setError(
          `This asset is currently active in project ${element.currentProjectId}. ` +
          `You need to transfer it to this project first. Click "Initiate Transfer" below for instructions.`
        );
        setLoading(false);
        return;
      }

      const linkResponse = await fetch(`/api/elements/${element.id}/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          speckleElementId,
          notes: `Linked to ${speckleElementName || speckleElementId}`,
        }),
      });

      if (!linkResponse.ok) {
        throw new Error('Failed to link element to BIM model');
      }

      setStep('success');
      onElementLinked(element);

      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link element');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    await stopScanner();
    setMode('manual');
    setAssetNumber('');
    setElement(null);
    setStep('input');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  const content = (
    <>
      {!embedded && (
        <div className="modal-header">
          <h2>Link Existing Asset</h2>
          <button className="close-button" onClick={handleClose}>×</button>
        </div>
      )}

        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}

          {step === 'input' && (
            <>
              <div className="bim-element-info">
                <strong>Selected BIM Element:</strong>
                <p>{speckleElementName || speckleElementId}</p>
              </div>

              <p>Is this a reused element from another project?</p>

              <div className="mode-selector">
                <button
                  className={`mode-button ${mode === 'scan' ? 'active' : ''}`}
                  onClick={() => setMode('scan')}
                >
                  📷 Scan QR Code
                </button>
                <button
                  className={`mode-button ${mode === 'manual' ? 'active' : ''}`}
                  onClick={async () => {
                    await stopScanner();
                    setMode('manual');
                  }}
                >
                  ⌨️ Enter Manually
                </button>
              </div>

              {mode === 'scan' ? (
                <div className="scanner-container">
                  <div id="qr-reader" style={{ width: '100%' }}></div>
                  {isScanning && (
                    <p className="scanning-hint">Point your camera at the QR code on the physical element</p>
                  )}
                </div>
              ) : (
                <div className="manual-input">
                  <label>Asset Number:</label>
                  <div className="input-group">
                    <input
                      type="text"
                      value={assetNumber}
                      onChange={(e) => setAssetNumber(e.target.value)}
                      placeholder="e.g., IfcMember-2024-000001"
                      onKeyPress={(e) => e.key === 'Enter' && handleManualLookup()}
                    />
                    <button 
                      className="btn-primary" 
                      onClick={handleManualLookup}
                      disabled={loading || !assetNumber}
                    >
                      {loading ? 'Searching...' : 'Look Up'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {step === 'confirm' && element && (
            <div className="confirmation-step">
              <h3>Element Found!</h3>
              
              <div className="element-details">
                <table>
                  <tbody>
                    <tr>
                      <td><strong>Asset Number:</strong></td>
                      <td>{element.assetNumber}</td>
                    </tr>
                    <tr>
                      <td><strong>IFC Type:</strong></td>
                      <td>{element.ifcType}</td>
                    </tr>
                    <tr>
                      <td><strong>Description:</strong></td>
                      <td>{element.description}</td>
                    </tr>
                    <tr>
                      <td><strong>Current Status:</strong></td>
                      <td>
                        <span className={`status-badge status-${element.status}`}>
                          {element.status}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Current Condition:</strong></td>
                      <td>{element.currentCondition}</td>
                    </tr>
                    {element.currentProjectId && (
                      <tr>
                        <td><strong>Current Project:</strong></td>
                        <td>{element.currentProjectId}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="confirmation-question">
                <p><strong>Link this asset to the selected BIM element?</strong></p>
                <p className="help-text">
                  This will create a mapping between the physical asset and the 3D model element.
                </p>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="success-step">
              <div className="success-icon">✅</div>
              <h3>Asset Linked Successfully!</h3>
              <p>The physical asset is now linked to the BIM element.</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {step === 'input' && (
            <button className="btn-secondary" onClick={handleClose}>
              No, this is a new element
            </button>
          )}
          {step === 'confirm' && (
            <>
              <button className="btn-secondary" onClick={() => {
                setStep('input');
                setElement(null);
                setAssetNumber('');
                setError(null);
              }}>
                Back
              </button>
              {element?.currentProjectId && element.currentProjectId !== projectId && element.status === 'active' ? (
                <button 
                  className="btn-warning" 
                  onClick={handleInitiateTransfer}
                >
                  📦 Initiate Transfer
                </button>
              ) : (
                <button 
                  className="btn-primary" 
                  onClick={handleConfirmLink}
                  disabled={loading}
                >
                  {loading ? 'Linking...' : 'Confirm Link'}
                </button>
              )}
            </>
          )}
      </div>

      <style jsx>{`
          .element-linking-modal {
            max-width: 600px;
          }

          .bim-element-info {
            background: var(--color-bg-secondary);
            padding: var(--space-md);
            border-radius: var(--border-radius);
            margin-bottom: var(--space-lg);
          }

          .bim-element-info p {
            margin: var(--space-xs) 0 0 0;
            font-size: var(--font-size-md);
            color: var(--color-primary);
          }

          .mode-selector {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: var(--space-md);
            margin: var(--space-lg) 0;
          }

          .mode-button {
            padding: var(--space-md);
            border: 2px solid var(--color-border);
            border-radius: var(--border-radius);
            background: white;
            cursor: pointer;
            font-size: var(--font-size-md);
            transition: all 0.2s;
          }

          .mode-button:hover {
            border-color: var(--color-primary);
          }

          .mode-button.active {
            border-color: var(--color-primary);
            background: var(--color-primary-light);
          }

          .scanner-container {
            margin: var(--space-lg) 0;
            text-align: center;
          }

          .scanning-hint {
            margin-top: var(--space-md);
            color: var(--color-text-secondary);
            font-style: italic;
          }

          .manual-input {
            margin: var(--space-lg) 0;
          }

          .manual-input label {
            display: block;
            font-weight: 600;
            margin-bottom: var(--space-sm);
          }

          .input-group {
            display: flex;
            gap: var(--space-sm);
          }

          .input-group input {
            flex: 1;
            padding: var(--space-sm);
            border: 1px solid var(--color-border);
            border-radius: var(--border-radius);
            font-size: var(--font-size-md);
          }

          .element-details table {
            width: 100%;
            border-collapse: collapse;
            margin: var(--space-lg) 0;
          }

          .element-details td {
            padding: var(--space-sm);
            border-bottom: 1px solid var(--color-border);
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

          .btn-warning {
            background: var(--color-warning);
            color: white;
            padding: var(--space-sm) var(--space-lg);
            border: none;
            border-radius: var(--border-radius);
            cursor: pointer;
            font-size: var(--font-size-md);
            font-weight: 600;
            transition: opacity 0.2s;
          }

          .btn-warning:hover {
            opacity: 0.9;
          }

          .confirmation-question {
            background: var(--color-primary-light);
            padding: var(--space-md);
            border-radius: var(--border-radius);
            margin-top: var(--space-lg);
          }

          .help-text {
            margin-top: var(--space-sm);
            font-size: var(--font-size-sm);
            color: var(--color-text-secondary);
          }

          .success-step {
            text-align: center;
            padding: var(--space-xl);
          }

          .success-icon {
            font-size: 64px;
            margin-bottom: var(--space-md);
          }

          .success-step h3 {
            color: var(--color-success);
            margin-bottom: var(--space-sm);
          }
      `}</style>
    </>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content element-linking-modal" onClick={(e) => e.stopPropagation()}>
        {content}
      </div>
    </div>
  );
}
