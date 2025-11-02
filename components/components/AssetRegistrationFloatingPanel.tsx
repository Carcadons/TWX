"use client";
import { useRef, useEffect } from "react";
import { useDraggable } from "../hooks/useDraggable";
import ElementRegistrationModal from "./ElementRegistrationModal";

interface AssetRegistrationFloatingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
  selectedElementId?: string;
  selectedElementName?: string;
  selectedElementType?: string;
  selectedElementProperties?: Record<string, any>;
}

export default function AssetRegistrationFloatingPanel({ isOpen, onClose, projectId, selectedElementId, selectedElementName, selectedElementType, selectedElementProperties }: AssetRegistrationFloatingPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  const draggable = useDraggable({
    storageKey: 'twx-asset-registration-panel-position',
    defaultPosition: typeof window !== 'undefined' 
      ? { x: (window.innerWidth - 850) / 2, y: (window.innerHeight - 600) / 2 }
      : { x: 100, y: 100 }
  });

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

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
            <h3>Asset Registration</h3>
            <button onClick={onClose} className="close-button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div className="panel-content">
            <ElementRegistrationModal
              isOpen={true}
              onClose={onClose}
              projectId={projectId || ""}
              speckleElementId={selectedElementId}
              speckleElementName={selectedElementName}
              speckleElementType={selectedElementType}
              speckleElementProperties={selectedElementProperties}
              onElementRegistered={(element) => {
                onClose();
              }}
              embedded={true}
            />
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
          width: 850px;
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
          background: linear-gradient(135deg, #ff6600 0%, #ff8833 100%);
          color: white;
          user-select: none;
        }

        .panel-header h3 {
          margin: 0;
          font-size: var(--font-size-lg);
          font-weight: 600;
        }

        .close-button {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          padding: var(--space-xs);
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: background 0.2s;
        }

        .close-button:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .panel-content {
          overflow-y: auto;
          flex: 1;
        }

        .info-section {
          margin-bottom: var(--space-lg);
        }

        .info-text {
          color: var(--color-gray-700);
          line-height: 1.6;
          margin: 0;
        }

        .btn {
          width: 100%;
          padding: var(--space-md);
          border: none;
          border-radius: var(--border-radius);
          font-size: var(--font-size-base);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-sm);
        }

        .btn-primary {
          background: var(--color-primary);
          color: white;
        }

        .btn-primary:hover {
          background: #ff7711;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(255, 102, 0, 0.3);
        }

        .help-section {
          margin-top: var(--space-xl);
          padding: var(--space-md);
          background: var(--color-gray-50);
          border-radius: var(--border-radius);
        }

        .help-section h4 {
          margin: 0 0 var(--space-sm) 0;
          font-size: var(--font-size-base);
          font-weight: 600;
          color: var(--color-gray-800);
        }

        .help-section ul {
          margin: 0;
          padding-left: var(--space-lg);
          color: var(--color-gray-700);
        }

        .help-section li {
          margin-bottom: var(--space-xs);
          line-height: 1.5;
        }

        .help-note {
          margin: var(--space-md) 0 0 0;
          padding-top: var(--space-md);
          border-top: 1px solid var(--color-gray-200);
          color: var(--color-gray-600);
          font-size: var(--font-size-sm);
          line-height: 1.5;
        }

        @media (max-width: 768px) {
          .floating-panel {
            width: 95vw;
            max-height: 90vh;
          }
        }
      `}</style>
    </>
  );
}
