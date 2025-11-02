"use client";
import { useEffect, useState, useRef } from "react";
import InspectionPanel from "../../components/InspectionPanel";

interface SelectedElement {
  id: string;
  name: string;
  type: string;
  properties: Record<string, any>;
}

export default function ViewerCore() {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);

  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [colorCodingEnabled, setColorCodingEnabled] = useState(false);
  const [originalMaterials, setOriginalMaterials] = useState<Map<string, any>>(new Map()); // Store original materials

  // Debug: Log when selectedElement changes
  useEffect(() => {
    console.log("🔍 ViewerCore selectedElement changed:", selectedElement);
  }, [selectedElement]);

  // Initialize Speckle Viewer
  useEffect(() => {
    let mounted = true;

    const initializeViewer = async () => {
      if (!containerRef.current) return;

      try {
        console.log("🚀 Initializing viewer...");

        const { Viewer, UrlHelper, SpeckleLoader, CameraController, SelectionExtension, ViewerEvent } = 
          await import("@speckle/viewer");

        const viewer = new Viewer(containerRef.current);
        await viewer.init();

        if (!mounted) return;

        // Add extensions
        viewer.createExtension(CameraController);
        viewer.createExtension(SelectionExtension);

        viewerRef.current = viewer;

        // Load model
        const modelUrl = "https://app.speckle.systems/projects/6db9f977d5/models/ccbcddb5c0";
        const urls = await UrlHelper.getResourceUrls(modelUrl);

        for (const url of urls) {
          const loader = new SpeckleLoader(viewer.getWorldTree(), url, "");
          await viewer.loadObject(loader, true);
        }

        // Store original materials after loading
        storeOriginalMaterials();

        // Listen to selection events
        viewer.on(ViewerEvent.ObjectClicked, (selectionEvent: any) => {
          console.log("🎯 Selection event received:", selectionEvent);

          if (selectionEvent && selectionEvent.hits && selectionEvent.hits.length > 0) {
            const hit = selectionEvent.hits[0];
            const nodeData = hit.node?.model?.raw;

            if (nodeData) {
              const element: SelectedElement = {
                id: nodeData.id || nodeData.speckle_id || nodeData.applicationId || "unknown",
                name: nodeData.name || nodeData.Name || nodeData.displayName || "Unnamed Element", 
                type: nodeData.speckle_type?.split('.').pop() || nodeData.category || nodeData.type || "Element",
                properties: nodeData
              };

              console.log("✅ Created element object:", element);
              setSelectedElement(element);
            }
          } else {
            console.log("🔄 Clearing selection");
            setSelectedElement(null);
          }
        });

        viewer.on(ViewerEvent.ObjectDoubleClicked, (selectionEvent: any) => {
          console.log("🎯 Double-click event:", selectionEvent);
        });

        setIsLoading(false);
        console.log("✅ Viewer initialized successfully");

      } catch (err) {
        console.error("❌ Viewer initialization failed:", err);
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load viewer");
          setIsLoading(false);
        }
      }
    };

    // Function to store original materials for later reset
    const storeOriginalMaterials = () => {
      if (!viewerRef.current) return;

      try {
        console.log("💾 Storing original materials...");
        const worldTree = viewerRef.current.getWorldTree();
        const renderer = viewerRef.current.getRenderer();

        if (!worldTree || !renderer) return;

        const renderTree = worldTree.getRenderTree();
        if (!renderTree) return;

        const materialsMap = new Map();

        // Walk through all nodes and store their original materials
        worldTree.walk((node) => {
          const renderViews = renderTree.getRenderViewsForNode(node);
          if (renderViews && renderViews.length > 0) {
            renderViews.forEach(rv => {
              try {
                // Use getBatchMaterial to get the original material
                const originalMaterial = renderer.getBatchMaterial(rv);
                if (originalMaterial && rv.batchId) {
                  materialsMap.set(rv.batchId, {
                    renderView: rv,
                    material: originalMaterial.clone() // Clone to preserve original
                  });
                }
              } catch (e) {
                // Silently skip if getBatchMaterial fails for this render view
              }
            });
          }
          return true;
        });

        setOriginalMaterials(materialsMap);
        console.log(`💾 Stored ${materialsMap.size} original materials`);
      } catch (error) {
        console.warn("⚠️ Failed to store original materials:", error);
      }
    };

    initializeViewer();

    return () => {
      mounted = false;
      if (viewerRef.current) {
        try {
          viewerRef.current.off?.(ViewerEvent.ObjectClicked);
          viewerRef.current.off?.(ViewerEvent.ObjectDoubleClicked);
          viewerRef.current.dispose();
        } catch (e) {
          console.warn("Viewer disposal warning:", e);
        }
      }
    };
  }, []);

  // Color coding toggle with improved material reset
  const toggleColorCoding = () => {
    if (!viewerRef.current) return;

    try {
      if (colorCodingEnabled) {
        // Reset colors using multiple approaches for robustness
        console.log("🎨 Resetting colors to original materials...");

        const renderer = viewerRef.current.getRenderer();
        if (!renderer) {
          console.warn("❌ No renderer available");
          setColorCodingEnabled(false);
          return;
        }

        // Method 1: Try the official resetMaterials API first
        try {
          renderer.resetMaterials();
          console.log("✅ Materials reset successfully using resetMaterials()");
        } catch (resetError) {
          console.warn("⚠️ resetMaterials failed, trying fallback methods:", resetError);

          // Method 2: Use stored original materials
          if (originalMaterials.size > 0) {
            console.log("🔄 Using stored original materials...");
            try {
              originalMaterials.forEach((materialData, batchId) => {
                try {
                  renderer.setMaterial([materialData.renderView], materialData.material);
                } catch (e) {
                  console.warn(`⚠️ Failed to reset material for batch ${batchId}:`, e);
                }
              });
              console.log("✅ Reset using stored original materials");
            } catch (fallbackError) {
              console.warn("❌ Stored materials reset failed:", fallbackError);

              // Method 3: Final fallback - try to get default materials per render view
              console.log("🔄 Trying per-renderView default materials...");
              const worldTree = viewerRef.current.getWorldTree();
              if (worldTree) {
                const renderTree = worldTree.getRenderTree();
                if (renderTree) {
                  worldTree.walk((node) => {
                    const renderViews = renderTree.getRenderViewsForNode(node);
                    if (renderViews && renderViews.length > 0) {
                      renderViews.forEach(rv => {
                        try {
                          const defaultMaterial = renderer.getBatchMaterial(rv);
                          if (defaultMaterial) {
                            renderer.setMaterial([rv], defaultMaterial);
                          }
                        } catch (e) {
                          // Silent fallback
                        }
                      });
                    }
                    return true;
                  });
                  console.log("✅ Reset using per-renderView default materials");
                }
              }
            }
          } else {
            console.warn("❌ No stored original materials available for fallback");
          }
        }

        console.log("🎨 Color reset completed");

      } else {
        // Apply colors based on inspection status
        const inspections = JSON.parse(localStorage.getItem('all-inspections') || '{}');

        if (Object.keys(inspections).length === 0) {
          console.log("🎨 No inspections found to color");
          return;
        }

        console.log("🎨 Starting to apply colors to", Object.keys(inspections).length, "elements");

        const worldTree = viewerRef.current.getWorldTree();
        const renderer = viewerRef.current.getRenderer();

        if (!worldTree || !renderer) {
          console.warn("❌ Could not get world tree or renderer");
          return;
        }

        const renderTree = worldTree.getRenderTree();
        if (!renderTree) {
          console.warn("❌ Could not get render tree");
          return;
        }

        // Batch render views by color for performance
        const colorBatches = {
          green: [],
          red: [],
          gray: []
        };

        // Find matching nodes and batch their render views
        worldTree.walk((node) => {
          const nodeData = node?.model?.raw;
          if (!nodeData) return true;

          const possibleIds = [
            nodeData.id,
            nodeData.speckle_id, 
            nodeData.applicationId,
            nodeData.elementId
          ].filter(Boolean);

          for (const nodeId of possibleIds) {
            if (inspections[nodeId]) {
              const inspection = inspections[nodeId];
              const rvs = renderTree.getRenderViewsForNode(node);

              if (rvs && rvs.length > 0) {
                if (inspection.status === 'ok') {
                  colorBatches.green.push(...rvs);
                  console.log(`✅ Found node for inspection ID ${nodeId} - adding to GREEN batch`);
                } else if (inspection.status === 'issue') {
                  colorBatches.red.push(...rvs);
                  console.log(`⚠️ Found node for inspection ID ${nodeId} - adding to RED batch`);
                } else {
                  colorBatches.gray.push(...rvs);
                  console.log(`⚫ Found node for inspection ID ${nodeId} - adding to GRAY batch`);
                }
              }
              break;
            }
          }
          return true;
        });

        // Apply materials in batches
        console.log(`🎨 Applying colors: ${colorBatches.green.length} green, ${colorBatches.red.length} red, ${colorBatches.gray.length} gray render views`);

        if (colorBatches.green.length > 0) {
          const greenMaterial = {
            color: 0x22c55e,
            opacity: 1,
            roughness: 0.8,
            metalness: 0.1,
            vertexColors: false
          };
          renderer.setMaterial(colorBatches.green, greenMaterial);
          console.log(`✅ Applied green color to ${colorBatches.green.length} render views`);
        }

        if (colorBatches.red.length > 0) {
          const redMaterial = {
            color: 0xef4444,
            opacity: 1,
            roughness: 0.8,
            metalness: 0.1,
            vertexColors: false
          };
          renderer.setMaterial(colorBatches.red, redMaterial);
          console.log(`🔴 Applied red color to ${colorBatches.red.length} render views`);
        }

        if (colorBatches.gray.length > 0) {
          const grayMaterial = {
            color: 0x808080,
            opacity: 1,
            roughness: 0.8,
            metalness: 0.1,
            vertexColors: false
          };
          renderer.setMaterial(colorBatches.gray, grayMaterial);
          console.log(`⚫ Applied gray color to ${colorBatches.gray.length} render views`);
        }

        console.log("🎨 Color application completed");
      }

      setColorCodingEnabled(!colorCodingEnabled);
    } catch (error) {
      console.error("❌ Color coding failed:", error);
    }
  };

  if (error) {
    return (
      <div className="viewer-container">
        <div className="error-state">
          <div className="error-content">
            <h3>Unable to load viewer</h3>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>
              Reload
            </button>
          </div>
        </div>

        <style jsx>{`
          .viewer-container {
            display: flex;
            width: 100%;
            height: 100%;
          }

          .error-state {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--color-gray-50);
          }

          .error-content {
            text-align: center;
            max-width: 400px;
            padding: var(--space-2xl);
          }

          .error-content h3 {
            font-size: var(--font-size-xl);
            font-weight: 600;
            color: var(--color-gray-900);
            margin-bottom: var(--space-md);
          }

          .error-content p {
            color: var(--color-gray-600);
            margin-bottom: var(--space-xl);
            line-height: 1.6;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="viewer-container">
      {/* Main 3D Viewer */}
      <div className="viewer-main">
        <div ref={containerRef} className="viewer-canvas" />

        {/* Loading State */}
        {isLoading && (
          <div className="loading-overlay">
            <div className="loading-content">
              <div className="loading-spinner"></div>
              <p>Loading 3D Model...</p>
            </div>
          </div>
        )}

        {/* Controls */}
        {!isLoading && (
          <div className="viewer-controls">
            <button
              onClick={toggleColorCoding}
              className={`btn btn-sm ${colorCodingEnabled ? 'btn-success' : 'btn-secondary'}`}
            >
              {colorCodingEnabled ? 'Colors ON' : 'Colors OFF'}
            </button>
          </div>
        )}

        {/* Selection Indicator */}
        {selectedElement && !isLoading && (
          <div className="selection-indicator">
            <div className="selection-dot"></div>
            <span>Selected: {selectedElement.name || selectedElement.type}</span>
          </div>
        )}

        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="debug-info">
            <div>Selected: {selectedElement ? selectedElement.id : 'None'}</div>
            <div>Colors: {colorCodingEnabled ? 'ON' : 'OFF'}</div>
            <div>Original Materials: {originalMaterials.size}</div>
          </div>
        )}
      </div>

      {/* Inspection Panel */}
      <InspectionPanel 
        selectedElement={selectedElement}
        onInspectionChange={() => {
          console.log("🔄 onInspectionChange called");
          if (colorCodingEnabled) {
            // Refresh colors when inspection data changes
            toggleColorCoding();
            setTimeout(() => toggleColorCoding(), 100);
          }
        }}
      />

      <style jsx>{`
        .viewer-container {
          display: flex;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .viewer-main {
          flex: 1;
          position: relative;
          min-width: 300px;
          background: var(--color-gray-100);
        }

        .viewer-canvas {
          width: 100%;
          height: 100%;
        }

        .loading-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: var(--color-white);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
        }

        .loading-content {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-lg);
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid var(--color-gray-200);
          border-top: 3px solid var(--color-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .loading-content p {
          font-size: var(--font-size-base);
          color: var(--color-gray-600);
          margin: 0;
        }

        .viewer-controls {
          position: absolute;
          top: var(--space-lg);
          right: var(--space-lg);
          z-index: 50;
        }

        .selection-indicator {
          position: absolute;
          top: var(--space-lg);
          left: var(--space-lg);
          background: var(--color-primary);
          color: var(--color-white);
          padding: var(--space-sm) var(--space-md);
          border-radius: var(--border-radius);
          font-size: var(--font-size-sm);
          font-weight: 500;
          z-index: 50;
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          max-width: 300px;
          word-break: break-word;
          box-shadow: var(--shadow-md);
        }

        .selection-dot {
          width: 8px;
          height: 8px;
          background: var(--color-white);
          border-radius: 50%;
          flex-shrink: 0;
        }

        .debug-info {
          position: absolute;
          bottom: var(--space-lg);
          left: var(--space-lg);
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: var(--space-sm);
          border-radius: var(--border-radius);
          font-size: var(--font-size-xs);
          font-family: monospace;
          z-index: 50;
        }

        /* Mobile Styles */
        @media (max-width: 768px) {
          .viewer-container {
            flex-direction: column;
          }

          .viewer-main {
            flex: 1;
            min-height: 50vh;
          }

          .viewer-controls {
            top: var(--space-md);
            right: var(--space-md);
          }

          .selection-indicator {
            top: var(--space-md);
            left: var(--space-md);
            right: 80px;
            max-width: none;
          }

          .debug-info {
            bottom: var(--space-md);
            left: var(--space-md);
          }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}