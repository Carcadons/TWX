"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import InspectionPanel from "../../components/InspectionPanel";
import { twxApi } from "../../lib/api";

interface SelectedElement {
  id: string;
  name: string;
  type: string;
  properties: Record<string, any>;
}

interface ProjectStats {
  totalElements: number;
  inspectedElements: number;
  passedElements: number;
  issueElements: number;
  inspectionRate: number;
}

interface Project {
  id: string;
  name: string;
  status: string;
  speckleUrl?: string;
  createdAt?: string;
  lastModified?: string;
}

interface ViewerCoreProps {
  projectId: string;
}

export default function ViewerCore({ projectId }: ViewerCoreProps) {
  const router = useRouter();

  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const filteringExtensionRef = useRef<any>(null);
  const selectionExtensionRef = useRef<any>(null);

  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [colorCodingEnabled, setColorCodingEnabled] = useState(false);
  const [originalMaterials, setOriginalMaterials] = useState<Map<string, any>>(new Map());
  const [hiddenElements, setHiddenElements] = useState<string[]>([]);
  const [projectStats, setProjectStats] = useState<ProjectStats>({
    totalElements: 0,
    inspectedElements: 0,
    passedElements: 0,
    issueElements: 0,
    inspectionRate: 0
  });
  const [statsVisible, setStatsVisible] = useState(true);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  // Debug: Log when selectedElement changes
  useEffect(() => {
    console.log("🔍 ViewerCore selectedElement changed:", selectedElement);
  }, [selectedElement]);

  // Debug: Log when projectId changes
  useEffect(() => {
    console.log("🆔 ViewerCore projectId changed:", projectId);
  }, [projectId]);

  // Calculate project statistics
  const calculateStats = async () => {
    if (!projectId) return;

    try {
      const inspections = await twxApi.getInspections(projectId as string);

      // Get total elements from the loaded 3D model using better counting methods
      let totalElements = 0;

      if (viewerRef.current) {
        const worldTree = viewerRef.current.getWorldTree();
        if (worldTree) {
          try {
            // Method 1: Try using the total node count from WorldTree
            const nodeCount = worldTree.getNodeCount?.();
            if (nodeCount && nodeCount > 0) {
              totalElements = nodeCount;
              console.log(`📊 Using WorldTree.getNodeCount(): ${totalElements}`);
            } else {
              // Method 2: Count atomic nodes (standalone objects like doors, windows, walls)
              const atomicNodes = worldTree.findAll((node) => {
                return node.model?.atomic === true;
              });

              if (atomicNodes && atomicNodes.length > 0) {
                totalElements = atomicNodes.length;
                console.log(`📊 Using atomic nodes count: ${totalElements}`);
              } else {
                // Method 3: Count nodes with renderViews (actually renderable elements)
                const renderTree = worldTree.getRenderTree();
                if (renderTree) {
                  const renderableNodes = renderTree.getRenderableNodes();
                  if (renderableNodes && renderableNodes.length > 0) {
                    totalElements = renderableNodes.length;
                    console.log(`📊 Using renderable nodes count: ${totalElements}`);
                  } else {
                    // Method 4: Fallback to our original counting method but with better filtering
                    worldTree.walk((node) => {
                      const nodeData = node?.model?.raw;
                      // Count nodes that have IDs and are not just container/group nodes
                      if (nodeData && 
                          (nodeData.id || nodeData.speckle_id || nodeData.applicationId) &&
                          nodeData.speckle_type && 
                          !nodeData.speckle_type.includes('Collection') &&
                          !nodeData.speckle_type.includes('Group')) {
                        totalElements++;
                      }
                      return true;
                    });
                    console.log(`📊 Using filtered walk count: ${totalElements}`);
                  }
                }
              }
            }
          } catch (countError) {
            console.warn("Error counting elements:", countError);
            // Final fallback - basic walk
            worldTree.walk((node) => {
              if (node?.model?.raw?.id) {
                totalElements++;
              }
              return true;
            });
            console.log(`📊 Using basic fallback count: ${totalElements}`);
          }
        }
      }

      const inspectedElements = inspections.length;
      const passedElements = inspections.filter(i => i.status === 'ok').length;
      const issueElements = inspections.filter(i => i.status === 'issue').length;
      const inspectionRate = totalElements > 0 ? Math.round((inspectedElements / totalElements) * 100) : 0;

      console.log(`📊 Final statistics: ${totalElements} total, ${inspectedElements} inspected, ${passedElements} passed, ${issueElements} issues`);

      setProjectStats({
        totalElements,
        inspectedElements,
        passedElements,
        issueElements,
        inspectionRate
      });
    } catch (error) {
      console.error("Failed to calculate project stats:", error);
    }
  };

  // Load project data
  const loadProject = async (id: string) => {
    try {
      console.log(`🔄 Loading project data for ID: ${id}`);

      const response = await fetch(`/api/projects?id=${id}`);
      const result = await response.json();

      if (result.success && result.data) {
        setCurrentProject(result.data);
        console.log(`✅ Loaded project:`, result.data);
        return result.data;
      } else {
        throw new Error(result.error || 'Project not found');
      }
    } catch (error) {
      console.error(`❌ Failed to load project ${id}:`, error);
      throw error;
    }
  };

  // Initialize Speckle Viewer
  useEffect(() => {
    if (!projectId || typeof projectId !== 'string') {
      console.log("⏳ Waiting for projectId prop...");
      return;
    }

    let mounted = true;

    const initializeViewer = async () => {
      if (!containerRef.current) return;

      try {
        console.log(`🚀 Initializing viewer for project: ${projectId}`);
        setIsLoading(true);
        setError(null);

        // Load project data first
        const project = await loadProject(projectId);

        if (!project.speckleUrl) {
          throw new Error('Project does not have a Speckle URL configured');
        }

        // Set the project ID on the API service
        twxApi.setProject(projectId);
        console.log(`🆔 Set API project to: ${projectId}`);
        console.log(`🔗 Using Speckle URL: ${project.speckleUrl}`);

        const { Viewer, UrlHelper, SpeckleLoader, CameraController, SelectionExtension, FilteringExtension, ViewerEvent } = 
          await import("@speckle/viewer");

        const viewer = new Viewer(containerRef.current);
        await viewer.init();

        if (!mounted) return;

        // Add extensions
        viewer.createExtension(CameraController);
        const selectionExtension = viewer.createExtension(SelectionExtension);
        const filteringExtension = viewer.createExtension(FilteringExtension);

        viewerRef.current = viewer;
        filteringExtensionRef.current = filteringExtension;
        selectionExtensionRef.current = selectionExtension;

        // Load model using the project's Speckle URL
        const urls = await UrlHelper.getResourceUrls(project.speckleUrl);

        for (const url of urls) {
          const loader = new SpeckleLoader(viewer.getWorldTree(), url, "");
          await viewer.loadObject(loader, true);
        }

        // Store original materials after loading
        storeOriginalMaterials();

        // Calculate statistics after model is loaded and materials are stored
        setTimeout(() => {
          calculateStats();
        }, 1000); // Give the model a moment to fully load

        // Listen to selection events
        viewer.on(ViewerEvent.ObjectClicked, (selectionEvent: any) => {
          console.log("🎯 Selection event received:", selectionEvent);

          if (selectionEvent && selectionEvent.hits && selectionEvent.hits.length > 0) {
            // Find the first hit that is not hidden
            let hit = null;
            for (const currentHit of selectionEvent.hits) {
              const nodeData = currentHit.node?.model?.raw;
              if (nodeData) {
                const possibleIds = [
                  nodeData.id,
                  nodeData.speckle_id, 
                  nodeData.applicationId,
                  nodeData.elementId
                ].filter(Boolean);

                // Check if this element is hidden
                const isHidden = possibleIds.some(id => hiddenElements.includes(id));

                if (!isHidden) {
                  hit = currentHit;
                  break;
                }
              }
            }

            if (hit) {
              const nodeData = hit.node?.model?.raw;
              const element: SelectedElement = {
                id: nodeData.id || nodeData.speckle_id || nodeData.applicationId || "unknown",
                name: nodeData.name || nodeData.Name || nodeData.displayName || "Unnamed Element", 
                type: nodeData.speckle_type?.split('.').pop() || nodeData.category || nodeData.type || "Element",
                properties: nodeData
              };

              console.log("✅ Created element object:", element);
              setSelectedElement(element);
            } else {
              console.log("🔄 All hits are hidden or no valid hits found");
              setSelectedElement(null);
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

        worldTree.walk((node) => {
          const renderViews = renderTree.getRenderViewsForNode(node);
          if (renderViews && renderViews.length > 0) {
            renderViews.forEach(rv => {
              try {
                const originalMaterial = renderer.getBatchMaterial(rv);
                if (originalMaterial && rv.batchId) {
                  materialsMap.set(rv.batchId, {
                    renderView: rv,
                    material: originalMaterial.clone()
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
  }, [projectId]); // Re-run when projectId changes

  // Hide selected element
  const hideSelectedElement = () => {
    if (!selectedElement || !filteringExtensionRef.current || !selectionExtensionRef.current) return;

    try {
      console.log("🫥 Hiding selected element:", selectedElement.id);

      // CRITICAL: Clear selection first to avoid material conflicts
      selectionExtensionRef.current.clearSelection();

      // Hide the element using FilteringExtension
      filteringExtensionRef.current.hideObjects(
        [selectedElement.id], 
        'user-hide', // stateKey to separate from other filtering operations
        false, // includeDescendants
        false  // ghost - set to false for complete hiding
      );

      // Track hidden element for our button
      setHiddenElements(prev => [...prev, selectedElement.id]);
      setSelectedElement(null);

      console.log("✅ Element hidden successfully");
    } catch (error) {
      console.error("❌ Failed to hide element:", error);
    }
  };

  // Show all hidden elements
  const showAllHiddenElements = () => {
    if (!filteringExtensionRef.current || hiddenElements.length === 0) return;

    try {
      console.log("👁️ Showing all hidden elements:", hiddenElements);

      filteringExtensionRef.current.showObjects(
        hiddenElements,
        'user-hide' // same stateKey as used for hiding
      );

      // Clear our tracking
      setHiddenElements([]);

      console.log("✅ All elements shown successfully");
    } catch (error) {
      console.error("❌ Failed to show elements:", error);
    }
  };

  // Color coding toggle with API data
  const toggleColorCoding = async () => {
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
        // Apply colors based on inspection status from API
        console.log("🎨 Loading inspection data from API...");

        try {
          // Get all inspections from the API for this specific project
          const inspections = await twxApi.getInspections(projectId as string);
          console.log("📊 Loaded inspections from API:", inspections);

          if (!inspections || inspections.length === 0) {
            console.log("🎨 No inspections found in API - no colors to apply");
            return;
          }

          // Convert array to object for easier lookup
          const inspectionMap = {};
          inspections.forEach(inspection => {
            inspectionMap[inspection.elementId] = inspection;
          });

          console.log("🎨 Starting to apply colors to", Object.keys(inspectionMap).length, "elements");

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
              if (inspectionMap[nodeId]) {
                const inspection = inspectionMap[nodeId];
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

        } catch (apiError) {
          console.error("❌ Failed to load inspections from API:", apiError);
          console.log("❌ Cannot apply colors without API connection");
        }
      }

      setColorCodingEnabled(!colorCodingEnabled);
    } catch (error) {
      console.error("❌ Color coding failed:", error);
    }
  };

  // Update stats when inspections change
  const handleInspectionChange = () => {
    console.log("🔄 onInspectionChange called");
    calculateStats(); // Recalculate stats
    if (colorCodingEnabled) {
      // Refresh colors when inspection data changes
      toggleColorCoding();
      setTimeout(() => toggleColorCoding(), 100);
    }
  };

  // Early return if no projectId prop
  if (!projectId) {
    return (
      <div className="viewer-container">
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <p>Loading Project...</p>
          </div>
        </div>
        <style jsx>{`
          .viewer-container {
            display: flex;
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
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="viewer-container">
        <div className="error-state">
          <div className="error-content">
            <h3>Unable to load project</h3>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={() => router.push('/')}>
              Back to Projects
            </button>
            <button className="btn btn-secondary" onClick={() => window.location.reload()}>
              Retry
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

          .error-content button {
            margin: var(--space-sm);
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
              <p>Loading {currentProject ? currentProject.name : 'Project'}...</p>
              {currentProject && (
                <p className="loading-detail">Model: {currentProject.speckleUrl}</p>
              )}
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

            {hiddenElements.length > 0 && (
              <button
                onClick={showAllHiddenElements}
                className="btn btn-sm btn-info"
                title={`Show ${hiddenElements.length} hidden elements`}
              >
                Show All ({hiddenElements.length})
              </button>
            )}
          </div>
        )}

        {/* Selection Indicator */}
        {selectedElement && !isLoading && (
          <div className="selection-indicator">
            <div className="selection-dot"></div>
            <span>Selected: {selectedElement.name || selectedElement.type}</span>
            <button
              onClick={hideSelectedElement}
              className="hide-element-btn"
              title="Hide this element"
            >
              🫥 Hide
            </button>
          </div>
        )}

        {/* Project Statistics Box */}
        {!isLoading && statsVisible && (
          <div className="stats-box">
            <div className="stats-header">
              <h4>Project Statistics</h4>
              <button 
                onClick={() => setStatsVisible(false)}
                className="stats-close"
                title="Hide statistics"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="stats-content">
              <div className="stat-item">
                <span className="stat-label">Total Elements</span>
                <span className="stat-value">{projectStats.totalElements}</span>
              </div>

              <div className="stat-item">
                <span className="stat-label">Inspected</span>
                <span className="stat-value">{projectStats.inspectedElements}</span>
              </div>

              <div className="stat-item">
                <span className="stat-label">Passed</span>
                <span className="stat-value stat-success">{projectStats.passedElements}</span>
              </div>

              <div className="stat-item">
                <span className="stat-label">Issues</span>
                <span className="stat-value stat-error">{projectStats.issueElements}</span>
              </div>

              <div className="stat-item">
                <span className="stat-label">Hidden</span>
                <span className="stat-value stat-warning">{hiddenElements.length}</span>
              </div>

              <div className="stat-progress">
                <div className="progress-label">
                  <span>Inspection Progress</span>
                  <span>{projectStats.inspectionRate}%</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${projectStats.inspectionRate}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Show Stats Button (when hidden) */}
        {!isLoading && !statsVisible && (
          <button 
            onClick={() => setStatsVisible(true)}
            className="show-stats-btn"
            title="Show statistics"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3V21H21"/>
              <path d="M9 9L12 6L16 10L21 5"/>
              <circle cx="9" cy="9" r="2"/>
              <circle cx="12" cy="6" r="2"/>
              <circle cx="16" cy="10" r="2"/>
              <circle cx="21" cy="5" r="2"/>
            </svg>
          </button>
        )}

        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="debug-info">
            <div>Project ID: {projectId}</div>
            <div>Project: {currentProject?.name || 'Loading...'}</div>
            <div>Selected: {selectedElement ? selectedElement.id : 'None'}</div>
            <div>Colors: {colorCodingEnabled ? 'ON' : 'OFF'}</div>
            <div>Hidden Elements: {hiddenElements.length}</div>
            <div>Original Materials: {originalMaterials.size}</div>
          </div>
        )}
      </div>

      {/* Inspection Panel */}
      <InspectionPanel 
        selectedElement={selectedElement}
        projectId={projectId as string}
        onInspectionChange={handleInspectionChange}
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

        .loading-detail {
          font-size: var(--font-size-sm) !important;
          color: var(--color-gray-500) !important;
          word-break: break-all;
          max-width: 400px;
        }

        .viewer-controls {
          position: absolute;
          top: var(--space-lg);
          right: var(--space-lg);
          z-index: 50;
          display: flex;
          gap: var(--space-sm);
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
          max-width: 400px;
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

        .hide-element-btn {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: var(--color-white);
          padding: var(--space-xs) var(--space-sm);
          border-radius: var(--border-radius);
          font-size: var(--font-size-xs);
          cursor: pointer;
          transition: all 0.15s ease;
          margin-left: auto;
        }

        .hide-element-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          border-color: rgba(255, 255, 255, 0.5);
        }

        .stats-box {
          position: absolute;
          bottom: var(--space-lg);
          right: var(--space-lg);
          background: var(--color-white);
          border-radius: var(--border-radius-lg);
          box-shadow: var(--shadow-lg);
          border: var(--border-width) solid var(--color-gray-200);
          min-width: 280px;
          z-index: 50;
        }

        .stats-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-md) var(--space-lg);
          border-bottom: var(--border-width) solid var(--color-gray-200);
        }

        .stats-header h4 {
          margin: 0;
          font-size: var(--font-size-base);
          font-weight: 600;
          color: var(--color-gray-900);
        }

        .stats-close {
          background: none;
          border: none;
          color: var(--color-gray-500);
          cursor: pointer;
          padding: var(--space-xs);
          border-radius: var(--border-radius);
          transition: all 0.15s ease;
        }

        .stats-close:hover {
          background: var(--color-gray-100);
          color: var(--color-gray-700);
        }

        .stats-content {
          padding: var(--space-lg);
        }

        .stat-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-sm) 0;
        }

        .stat-label {
          font-size: var(--font-size-sm);
          color: var(--color-gray-600);
        }

        .stat-value {
          font-size: var(--font-size-base);
          font-weight: 600;
          color: var(--color-gray-900);
        }

        .stat-success {
          color: var(--color-success);
        }

        .stat-error {
          color: var(--color-error);
        }

        .stat-warning {
          color: var(--color-warning);
        }

        .stat-progress {
          margin-top: var(--space-md);
          padding-top: var(--space-md);
          border-top: var(--border-width) solid var(--color-gray-200);
        }

        .progress-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-sm);
          font-size: var(--font-size-sm);
          color: var(--color-gray-600);
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: var(--color-gray-200);
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: var(--color-primary);
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .show-stats-btn {
          position: absolute;
          bottom: var(--space-lg);
          right: var(--space-lg);
          background: var(--color-white);
          border: var(--border-width) solid var(--color-gray-200);
          border-radius: 50%;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: var(--shadow-md);
          color: var(--color-gray-600);
          transition: all 0.15s ease;
          z-index: 50;
        }

        .show-stats-btn:hover {
          background: var(--color-primary);
          color: var(--color-white);
          border-color: var(--color-primary);
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
            flex-direction: column;
          }

          .selection-indicator {
            top: var(--space-md);
            left: var(--space-md);
            right: var(--space-md);
            max-width: none;
          }

          .stats-box {
            bottom: var(--space-md);
            right: var(--space-md);
            left: var(--space-md);
            min-width: auto;
          }

          .show-stats-btn {
            bottom: var(--space-md);
            right: var(--space-md);
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