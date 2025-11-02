"use client";
import { useRef, useEffect } from "react";
import { useDraggable } from "../hooks/useDraggable";
import ElementLinkingModal from "./ElementLinkingModal";

interface AssetLinkingFloatingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
  selectedElementId?: string;
  selectedElementName?: string;
  onElementLinked?: () => void;
}

export default function AssetLinkingFloatingPanel({ 
  isOpen, 
  onClose, 
  projectId, 
  selectedElementId, 
  selectedElementName,
  onElementLinked
}: AssetLinkingFloatingPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  const draggable = useDraggable({
    storageKey: 'twx-asset-linking-panel-position',
    defaultPosition: typeof window !== 'undefined' 
      ? { x: (window.innerWidth - 650) / 2, y: (window.innerHeight - 500) / 2 }
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
            data-drag-handle
            style={{ cursor: 'move' }}
          >
            <h3>Link Existing Asset</h3>
            <button onClick={onClose} className="close-button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div className="panel-content">
            <ElementLinkingModal
              isOpen={true}
              onClose={onClose}
              projectId={projectId || ""}
              speckleElementId={selectedElementId || ""}
              speckleElementName={selectedElementName}
              onElementLinked={(element) => {
                onElementLinked?.();
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
          width: 650px;
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
          padding: 16px 20px;
          border-bottom: 1px solid var(--color-border);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: white;
          user-select: none;
        }

        .panel-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: var(--color-text);
        }

        .close-button {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-secondary);
          transition: color 0.2s;
        }

        .close-button:hover {
          color: var(--color-text);
        }

        .panel-content {
          flex: 1;
          overflow-y: auto;
          padding: 0;
        }

        @media (max-width: 768px) {
          .floating-panel {
            width: 100%;
            height: 100%;
            max-width: 100%;
            max-height: 100%;
            border-radius: 0;
          }
        }
      `}</style>
    </>
  );
}
