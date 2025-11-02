"use client";
import { useState, useEffect, useRef } from "react";
import { twxApi, useTWXApi } from "../lib/api";
import ElementTransferWorkflow from "./ElementTransferWorkflow";
import ElementHistoryPanel from "./ElementHistoryPanel";

interface SelectedElement {
  id: string;
  name: string;
  type: string;
  properties: Record<string, any>;
}

interface InspectionPanelProps {
  selectedElements: SelectedElement[];
  projectId: string;
  onInspectionChange: () => void;
  onClearSelection: () => void;
  onOpenAssetRegistration?: (elementId: string, elementName: string, elementType: string, elementProperties: Record<string, any>, projectId: string) => void;
  onOpenAssetLinking?: (elementId: string, elementName: string, projectId: string) => void;
  onOpenAssetTransfer?: (assetId: string, currentProjectId: string) => void;
}

interface InspectionData {
  // Basic Info
  inspector: string;
  status: "" | "ok" | "issue";
  notes: string;
  date: string;
  elementId?: string;
  projectId?: string;
  lastModifiedBy?: string;

  // TW Package Info
  designPackageNumber: string;
  designPackageDescription: string;
  riskCategories: string;

  // Planning & Scheduling
  plannedErectionDate: string;
  plannedDismantleDate: string;
  actualErectionDate: string;
  actualDismantleDate: string;

  // Location & Environment
  plannedLocation: string;
  actualLocation: string;
  environmentalConditions: string; // corrosive, marine, tunnel, adverse chemical, etc.

  // Technical Requirements
  loadingCriteria: string;
  surveyData: string;
  materialRequirements: string;
  installationMethodStatement: string;
  removalMethodStatement: string;

  // Commercial
  estimatedQuantities: string;
  estimatedCostDesign: string;
  estimatedCostConstruction: string;
  procurementReference: string;
  budgetComparison: string;
  materialCostCodes: string;

  // Quality & Compliance
  twcCheckingRemarks: string;
  iceCheckingRemarks: string;
  materialCertificates: string;
  labTestResults: string;
  usageHistory: string;
  overstressingRecord: string;

  // Stakeholders
  responsibleSitePerson: string;
  temporaryWorksCoordinator: string;
  temporaryWorksDesigner: string;
  independentCheckingEngineer: string;

  // Documentation
  designDocumentationRef: string;
  approvalDate: string;
  constructionCompletionDate: string;
  permitToLoadDate: string;
  permitToRemoveDate: string;
}

export default function InspectionPanel({ selectedElements, projectId, onInspectionChange, onClearSelection, onOpenAssetRegistration, onOpenAssetLinking, onOpenAssetTransfer }: InspectionPanelProps) {
  const { api, isOnline, currentProject } = useTWXApi();

  // ADD THIS LINE: Define selectedElement as a computed value
  const selectedElement = selectedElements.length > 0 ? selectedElements[0] : null;

  const [formData, setFormData] = useState<InspectionData>({
    inspector: "",
    status: "",
    notes: "",
    date: new Date().toISOString().split('T')[0],

    designPackageNumber: "",
    designPackageDescription: "",
    riskCategories: "",

    plannedErectionDate: "",
    plannedDismantleDate: "",
    actualErectionDate: "",
    actualDismantleDate: "",

    plannedLocation: "",
    actualLocation: "",
    environmentalConditions: "",

    loadingCriteria: "",
    surveyData: "",
    materialRequirements: "",
    installationMethodStatement: "",
    removalMethodStatement: "",

    estimatedQuantities: "",
    estimatedCostDesign: "",
    estimatedCostConstruction: "",
    procurementReference: "",
    budgetComparison: "",
    materialCostCodes: "",

    twcCheckingRemarks: "",
    iceCheckingRemarks: "",
    materialCertificates: "",
    labTestResults: "",
    usageHistory: "",
    overstressingRecord: "",

    responsibleSitePerson: "",
    temporaryWorksCoordinator: "",
    temporaryWorksDesigner: "",
    independentCheckingEngineer: "",

    designDocumentationRef: "",
    approvalDate: "",
    constructionCompletionDate: "",
    permitToLoadDate: "",
    permitToRemoveDate: ""
  });

  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [panelWidth, setPanelWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('twx-inspection-panel-width');
      if (saved) {
        const parsedWidth = parseInt(saved, 10);
        return Math.max(380, Math.min(800, parsedWidth));
      }
      const calculatedWidth = Math.floor(window.innerWidth * 0.3333);
      return Math.max(380, Math.min(800, calculatedWidth));
    }
    return 420;
  });
  const [isResizing, setIsResizing] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'technical' | 'commercial' | 'quality' | 'stakeholders'>('basic');
  
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [linkedElement, setLinkedElement] = useState<any>(null);
  const [assetLinkInfo, setAssetLinkInfo] = useState<any>(null);
  const [checkingAssetLink, setCheckingAssetLink] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Set the project ID on the API service when projectId prop changes
  useEffect(() => {
    if (projectId && projectId !== currentProject) {
      api.setProject(projectId);
    }
  }, [projectId, currentProject, api]);

  // Persist panel width to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('twx-inspection-panel-width', panelWidth.toString());
    }
  }, [panelWidth]);

  // Intercept mouse events BEFORE Speckle viewer's handlers
  useEffect(() => {
    const handleEl = resizeHandleRef.current;
    if (!handleEl) return;

    const interceptMouseDown = (e: MouseEvent) => {
      // Check if the event path includes our resize handle
      const path = e.composedPath();
      if (path.includes(handleEl)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation(); // Critical: stops Speckle's handlers
        setIsResizing(true);
      }
    };

    // Add to document with capture=true to run before Speckle's handlers
    document.addEventListener('mousedown', interceptMouseDown, { capture: true });
    document.addEventListener('pointerdown', interceptMouseDown, { capture: true });

    return () => {
      document.removeEventListener('mousedown', interceptMouseDown, { capture: true });
      document.removeEventListener('pointerdown', interceptMouseDown, { capture: true });
    };
  }, []);

  // Handle panel resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !panelRef.current) return;

      const containerRect = panelRef.current.parentElement?.getBoundingClientRect();
      if (!containerRect) return;

      const newWidth = containerRect.right - e.clientX;
      const clampedWidth = Math.max(380, Math.min(800, newWidth));
      setPanelWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      
      // Re-enable pointer events on viewer canvas
      const viewerCanvas = document.querySelector('.viewer-canvas') as HTMLElement;
      if (viewerCanvas) {
        viewerCanvas.style.pointerEvents = '';
      }
    };

    if (isResizing) {
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      
      // Disable pointer events on viewer canvas while resizing
      const viewerCanvas = document.querySelector('.viewer-canvas') as HTMLElement;
      if (viewerCanvas) {
        viewerCanvas.style.pointerEvents = 'none';
      }
      
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

  // Load inspection data when elements change
  useEffect(() => {
    if (selectedElements.length > 0) {
      // Load inspection data from the first selected element as template
      loadInspectionData(selectedElements[0].id);
      // Check if element is linked to an asset
      checkAssetLinking(selectedElements[0].id);
    } else {
      resetFormData();
      setAssetLinkInfo(null);
    }
  }, [selectedElements]);

  const resetFormData = () => {
    setFormData({
      inspector: "",
      status: "",
      notes: "",
      date: new Date().toISOString().split('T')[0],

      designPackageNumber: "",
      designPackageDescription: "",
      riskCategories: "",

      plannedErectionDate: "",
      plannedDismantleDate: "",
      actualErectionDate: "",
      actualDismantleDate: "",

      plannedLocation: "",
      actualLocation: "",
      environmentalConditions: "",

      loadingCriteria: "",
      surveyData: "",
      materialRequirements: "",
      installationMethodStatement: "",
      removalMethodStatement: "",

      estimatedQuantities: "",
      estimatedCostDesign: "",
      estimatedCostConstruction: "",
      procurementReference: "",
      budgetComparison: "",
      materialCostCodes: "",

      twcCheckingRemarks: "",
      iceCheckingRemarks: "",
      materialCertificates: "",
      labTestResults: "",
      usageHistory: "",
      overstressingRecord: "",

      responsibleSitePerson: "",
      temporaryWorksCoordinator: "",
      temporaryWorksDesigner: "",
      independentCheckingEngineer: "",

      designDocumentationRef: "",
      approvalDate: "",
      constructionCompletionDate: "",
      permitToLoadDate: "",
      permitToRemoveDate: ""
    });
  };

  // Load inspection data from API
  const loadInspectionData = async (elementId: string) => {
    if (!elementId || !projectId) return;

    setIsLoading(true);
    setSaveStatus('idle');

    try {
      const inspection = await api.getInspectionByElement(elementId, projectId);

      if (inspection) {
        setFormData({
          inspector: inspection.inspector || "",
          status: inspection.status || "",
          notes: inspection.notes || "",
          date: inspection.date || new Date().toISOString().split('T')[0],

          designPackageNumber: inspection.designPackageNumber || "",
          designPackageDescription: inspection.designPackageDescription || "",
          riskCategories: inspection.riskCategories || "",

          plannedErectionDate: inspection.plannedErectionDate || "",
          plannedDismantleDate: inspection.plannedDismantleDate || "",
          actualErectionDate: inspection.actualErectionDate || "",
          actualDismantleDate: inspection.actualDismantleDate || "",

          plannedLocation: inspection.plannedLocation || "",
          actualLocation: inspection.actualLocation || "",
          environmentalConditions: inspection.environmentalConditions || "",

          loadingCriteria: inspection.loadingCriteria || "",
          surveyData: inspection.surveyData || "",
          materialRequirements: inspection.materialRequirements || "",
          installationMethodStatement: inspection.installationMethodStatement || "",
          removalMethodStatement: inspection.removalMethodStatement || "",

          estimatedQuantities: inspection.estimatedQuantities || "",
          estimatedCostDesign: inspection.estimatedCostDesign || "",
          estimatedCostConstruction: inspection.estimatedCostConstruction || "",
          procurementReference: inspection.procurementReference || "",
          budgetComparison: inspection.budgetComparison || "",
          materialCostCodes: inspection.materialCostCodes || "",

          twcCheckingRemarks: inspection.twcCheckingRemarks || "",
          iceCheckingRemarks: inspection.iceCheckingRemarks || "",
          materialCertificates: inspection.materialCertificates || "",
          labTestResults: inspection.labTestResults || "",
          usageHistory: inspection.usageHistory || "",
          overstressingRecord: inspection.overstressingRecord || "",

          responsibleSitePerson: inspection.responsibleSitePerson || "",
          temporaryWorksCoordinator: inspection.temporaryWorksCoordinator || "",
          temporaryWorksDesigner: inspection.temporaryWorksDesigner || "",
          independentCheckingEngineer: inspection.independentCheckingEngineer || "",

          designDocumentationRef: inspection.designDocumentationRef || "",
          approvalDate: inspection.approvalDate || "",
          constructionCompletionDate: inspection.constructionCompletionDate || "",
          permitToLoadDate: inspection.permitToLoadDate || "",
          permitToRemoveDate: inspection.permitToRemoveDate || ""
        });
      } else {
        resetFormData();
      }
    } catch (error) {
      setSaveStatus('error');
      resetFormData();
    } finally {
      setIsLoading(false);
    }
  };

  // Check if element is linked to an asset
  const checkAssetLinking = async (elementId: string) => {
    if (!elementId) return;

    setCheckingAssetLink(true);
    try {
      const response = await fetch(`/api/elements/check-linking/${elementId}`);
      if (response.ok) {
        const data = await response.json();
        setAssetLinkInfo(data);
      } else {
        setAssetLinkInfo({ linked: false, asset: null });
      }
    } catch (error) {
      console.error('Error checking asset linking:', error);
      setAssetLinkInfo({ linked: false, asset: null });
    } finally {
      setCheckingAssetLink(false);
    }
  };

  // Save inspection data with debouncing
  const saveInspection = async (data: InspectionData, skipDebounce = false) => {
    if (!selectedElements.length || !projectId) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    const performSave = async () => {
      setSaveStatus('saving');

      try {
        if (isOnline) {
          // Save to all selected elements
          const savePromises = selectedElements.map(element => 
            api.saveInspection({
              ...data,
              elementId: element.id,
              projectId: projectId,
              lastModifiedBy: 'user'
            }, projectId)
          );

          const results = await Promise.all(savePromises);

          if (results.every(r => r)) {
            setSaveStatus('saved');
            onInspectionChange();
          } else {
            throw new Error('Some API saves failed');
          }
        } else {
          setSaveStatus('error');
        }

        setTimeout(() => setSaveStatus('idle'), 2000);

      } catch (error) {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    };

    if (skipDebounce) {
      await performSave();
    } else {
      saveTimeoutRef.current = setTimeout(performSave, 1000) as NodeJS.Timeout;
    }
  };

  // Update form field
  const updateField = (field: keyof InspectionData, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);

    // FIXED: Check selectedElements.length instead of selectedElement
    if (selectedElements.length > 0) {
      saveInspection(newData);
    }
  };

  // Clear inspection
  const clearInspection = async () => {
    // FIXED: Check selectedElement properly
    if (!selectedElement || !projectId) return;

    resetFormData();

    try {
      if (isOnline) {
        const existing = await api.getInspectionByElement(selectedElement.id, projectId);
        if (existing?.id) {
          await api.deleteInspection(existing.id);
        }
      }

      onInspectionChange();
    } catch (error) {
      // Error handling - fail silently
    }
  };

  // Export all data
  const exportAllData = async () => {
    if (!projectId) {
      return;
    }

    try {
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
      } else {
        throw new Error('No data to export from API');
      }
    } catch (error) {
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
    const count = selectedElements.length;
    switch (saveStatus) {
      case 'saving': return `Saving to ${count} element${count > 1 ? 's' : ''} in project ${projectId}...`;
      case 'saved': return `Saved to ${count} element${count > 1 ? 's' : ''} in project ${projectId}`;
      case 'error': return 'Save failed - API offline';
      default: return isOnline ? `Auto-save to ${count} element${count > 1 ? 's' : ''} in project ${projectId}` : 'API offline - cannot save';
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

  const renderBasicTab = () => (
    <div className="form-container">
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

      <div className="form-group">
        <label className="form-label">Status</label>
        <div className="status-select-wrapper">
          <select
            value={formData.status}
            onChange={(e) => updateField('status', e.target.value as "" | "ok" | "issue")}
            className={`form-select status-select ${formData.status ? `status-${formData.status}` : ''}`}
            disabled={isLoading}
          >
            <option value="">Select Status</option>
            <option value="ok">✓ Passed</option>
            <option value="issue">⚠ Requires Attention</option>
          </select>
        </div>
      </div>

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

      <div className="form-group">
        <label className="form-label">Design Package Number</label>
        <input
          type="text"
          value={formData.designPackageNumber}
          onChange={(e) => updateField('designPackageNumber', e.target.value)}
          placeholder="Enter package number"
          className="form-input"
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Package Description</label>
        <input
          type="text"
          value={formData.designPackageDescription}
          onChange={(e) => updateField('designPackageDescription', e.target.value)}
          placeholder="Brief description of TW package"
          className="form-input"
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Risk Categories</label>
        <select
          value={formData.riskCategories}
          onChange={(e) => updateField('riskCategories', e.target.value)}
          className="form-select"
          disabled={isLoading}
        >
          <option value="">Select Risk Category</option>
          <option value="low">Low Risk</option>
          <option value="medium">Medium Risk</option>
          <option value="high">High Risk</option>
          <option value="critical">Critical Risk</option>
        </select>
      </div>

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
  );

  const renderTechnicalTab = () => (
    <div className="form-container">
      <div className="form-group">
        <label className="form-label">Planned Erection Date</label>
        <input
          type="date"
          value={formData.plannedErectionDate}
          onChange={(e) => updateField('plannedErectionDate', e.target.value)}
          className="form-input"
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Planned Dismantle Date</label>
        <input
          type="date"
          value={formData.plannedDismantleDate}
          onChange={(e) => updateField('plannedDismantleDate', e.target.value)}
          className="form-input"
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Actual Erection Date</label>
        <input
          type="date"
          value={formData.actualErectionDate}
          onChange={(e) => updateField('actualErectionDate', e.target.value)}
          className="form-input"
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Actual Dismantle Date</label>
        <input
          type="date"
          value={formData.actualDismantleDate}
          onChange={(e) => updateField('actualDismantleDate', e.target.value)}
          className="form-input"
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Planned Location</label>
        <input
          type="text"
          value={formData.plannedLocation}
          onChange={(e) => updateField('plannedLocation', e.target.value)}
          placeholder="Where will this be erected?"
          className="form-input"
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Actual Location</label>
        <input
          type="text"
          value={formData.actualLocation}
          onChange={(e) => updateField('actualLocation', e.target.value)}
          placeholder="Where was this actually erected?"
          className="form-input"
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Environmental Conditions</label>
        <select
          value={formData.environmentalConditions}
          onChange={(e) => updateField('environmentalConditions', e.target.value)}
          className="form-select"
          disabled={isLoading}
        >
          <option value="">Select Environment</option>
          <option value="normal">Normal</option>
          <option value="corrosive">Corrosive</option>
          <option value="marine">Marine</option>
          <option value="tunnel">Tunnel</option>
          <option value="chemical">Adverse Chemical</option>
          <option value="extreme_weather">Extreme Weather</option>
        </select>
      </div>

      <div className="form-group form-group-full">
        <label className="form-label">Loading Criteria</label>
        <textarea
          value={formData.loadingCriteria}
          onChange={(e) => updateField('loadingCriteria', e.target.value)}
          placeholder="Specify loading requirements and criteria..."
          rows={3}
          className="form-textarea"
          disabled={isLoading}
        />
      </div>

      <div className="form-group form-group-full">
        <label className="form-label">Material Requirements</label>
        <textarea
          value={formData.materialRequirements}
          onChange={(e) => updateField('materialRequirements', e.target.value)}
          placeholder="Specify material requirements and specifications..."
          rows={3}
          className="form-textarea"
          disabled={isLoading}
        />
      </div>

      <div className="form-group form-group-full">
        <label className="form-label">Installation Method Statement</label>
        <textarea
          value={formData.installationMethodStatement}
          onChange={(e) => updateField('installationMethodStatement', e.target.value)}
          placeholder="Describe installation procedures..."
          rows={3}
          className="form-textarea"
          disabled={isLoading}
        />
      </div>

      <div className="form-group form-group-full">
        <label className="form-label">Removal Method Statement</label>
        <textarea
          value={formData.removalMethodStatement}
          onChange={(e) => updateField('removalMethodStatement', e.target.value)}
          placeholder="Describe removal procedures..."
          rows={3}
          className="form-textarea"
          disabled={isLoading}
        />
      </div>
    </div>
  );

  const renderCommercialTab = () => (
    <div className="form-container">
      <div className="form-group">
        <label className="form-label">Estimated Quantities</label>
        <input
          type="text"
          value={formData.estimatedQuantities}
          onChange={(e) => updateField('estimatedQuantities', e.target.value)}
          placeholder="Material quantities needed"
          className="form-input"
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Estimated Design Cost</label>
        <input
          type="text"
          value={formData.estimatedCostDesign}
          onChange={(e) => updateField('estimatedCostDesign', e.target.value)}
          placeholder="Cost for design phase"
          className="form-input"
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Estimated Construction Cost</label>
        <input
          type="text"
          value={formData.estimatedCostConstruction}
          onChange={(e) => updateField('estimatedCostConstruction', e.target.value)}
          placeholder="Cost for construction phase"
          className="form-input"
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Procurement Reference</label>
        <input
          type="text"
          value={formData.procurementReference}
          onChange={(e) => updateField('procurementReference', e.target.value)}
          placeholder="Procurement reference number"
          className="form-input"
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Material Cost Codes</label>
        <input
          type="text"
          value={formData.materialCostCodes}
          onChange={(e) => updateField('materialCostCodes', e.target.value)}
          placeholder="Cost codes for materials"
          className="form-input"
          disabled={isLoading}
        />
      </div>

      <div className="form-group form-group-full">
        <label className="form-label">Budget Comparison</label>
        <textarea
          value={formData.budgetComparison}
          onChange={(e) => updateField('budgetComparison', e.target.value)}
          placeholder="Comparison vs original budget..."
          rows={3}
          className="form-textarea"
          disabled={isLoading}
        />
      </div>
    </div>
  );

  const renderQualityTab = () => (
    <div className="form-container">
      <div className="form-group form-group-full">
        <label className="form-label">TWC Checking Remarks</label>
        <textarea
          value={formData.twcCheckingRemarks}
          onChange={(e) => updateField('twcCheckingRemarks', e.target.value)}
          placeholder="Temporary Works Coordinator inspection remarks..."
          rows={3}
          className="form-textarea"
          disabled={isLoading}
        />
      </div>

      <div className="form-group form-group-full">
        <label className="form-label">ICE Checking Remarks</label>
        <textarea
          value={formData.iceCheckingRemarks}
          onChange={(e) => updateField('iceCheckingRemarks', e.target.value)}
          placeholder="Independent Checking Engineer remarks..."
          rows={3}
          className="form-textarea"
          disabled={isLoading}
        />
      </div>

      <div className="form-group form-group-full">
        <label className="form-label">Material Certificates</label>
        <textarea
          value={formData.materialCertificates}
          onChange={(e) => updateField('materialCertificates', e.target.value)}
          placeholder="Material certification details..."
          rows={3}
          className="form-textarea"
          disabled={isLoading}
        />
      </div>

      <div className="form-group form-group-full">
        <label className="form-label">Lab Test Results</label>
        <textarea
          value={formData.labTestResults}
          onChange={(e) => updateField('labTestResults', e.target.value)}
          placeholder="Laboratory test results and analysis..."
          rows={3}
          className="form-textarea"
          disabled={isLoading}
        />
      </div>

      <div className="form-group form-group-full">
        <label className="form-label">Usage History</label>
        <textarea
          value={formData.usageHistory}
          onChange={(e) => updateField('usageHistory', e.target.value)}
          placeholder="Previous usage history of materials..."
          rows={3}
          className="form-textarea"
          disabled={isLoading}
        />
      </div>

      <div className="form-group form-group-full">
        <label className="form-label">Overstressing Record</label>
        <textarea
          value={formData.overstressingRecord}
          onChange={(e) => updateField('overstressingRecord', e.target.value)}
          placeholder="Record any overstressing incidents..."
          rows={3}
          className="form-textarea"
          disabled={isLoading}
        />
      </div>
    </div>
  );

  const renderStakeholdersTab = () => (
    <div className="form-container">
      <div className="form-group">
        <label className="form-label">Responsible Site Person (RSP)</label>
        <input
          type="text"
          value={formData.responsibleSitePerson}
          onChange={(e) => updateField('responsibleSitePerson', e.target.value)}
          placeholder="Name of RSP"
          className="form-input"
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Temporary Works Coordinator (TWC)</label>
        <input
          type="text"
          value={formData.temporaryWorksCoordinator}
          onChange={(e) => updateField('temporaryWorksCoordinator', e.target.value)}
          placeholder="Name of TWC"
          className="form-input"
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Temporary Works Designer (TWD)</label>
        <input
          type="text"
          value={formData.temporaryWorksDesigner}
          onChange={(e) => updateField('temporaryWorksDesigner', e.target.value)}
          placeholder="Name of TWD"
          className="form-input"
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Independent Checking Engineer (ICE)</label>
        <input
          type="text"
          value={formData.independentCheckingEngineer}
          onChange={(e) => updateField('independentCheckingEngineer', e.target.value)}
          placeholder="Name of ICE"
          className="form-input"
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Design Documentation Reference</label>
        <input
          type="text"
          value={formData.designDocumentationRef}
          onChange={(e) => updateField('designDocumentationRef', e.target.value)}
          placeholder="Reference to design documents"
          className="form-input"
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Approval Date</label>
        <input
          type="date"
          value={formData.approvalDate}
          onChange={(e) => updateField('approvalDate', e.target.value)}
          className="form-input"
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Construction Completion Date</label>
        <input
          type="date"
          value={formData.constructionCompletionDate}
          onChange={(e) => updateField('constructionCompletionDate', e.target.value)}
          className="form-input"
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Permit to Load Date</label>
        <input
          type="date"
          value={formData.permitToLoadDate}
          onChange={(e) => updateField('permitToLoadDate', e.target.value)}
          className="form-input"
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Permit to Remove Date</label>
        <input
          type="date"
          value={formData.permitToRemoveDate}
          onChange={(e) => updateField('permitToRemoveDate', e.target.value)}
          className="form-input"
          disabled={isLoading}
        />
      </div>
    </div>
  );

  return (
    <div 
      ref={panelRef}
      className="inspection-panel" 
      style={{ 
        width: `${panelWidth}px`,
        flex: `0 0 ${panelWidth}px`
      }}
    >
      {/* Custom Resize Handle */}
      <div
        ref={resizeHandleRef}
        className="resize-handle"
        title="Drag to resize panel"
      />

      {/* Header */}
      <div className="panel-header">
        <div className="header-left">
          <h2>TW Inspection</h2>
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

      {selectedElements.length > 0 ? (
        <div className="panel-content">
          {/* Element Asset Management */}
          {selectedElements.length === 1 && (
            <div className="card">
              <div className="card-header">
                <h3>Material Reuse Tracking</h3>
              </div>
              <div className="card-body">
                {checkingAssetLink ? (
                  <div className="loading-state">Checking asset link status...</div>
                ) : assetLinkInfo?.linked ? (
                  <div className="linked-element-info">
                    <div className="asset-linked-banner">
                      ✅ This element is linked to an asset
                    </div>
                    <div className="info-row">
                      <strong>Asset Number:</strong> {assetLinkInfo.asset.assetNumber}
                    </div>
                    <div className="info-row">
                      <strong>Status:</strong> 
                      <span className={`status-badge status-${assetLinkInfo.asset.status}`}>
                        {assetLinkInfo.asset.status}
                      </span>
                    </div>
                    <div className="info-row">
                      <strong>Condition:</strong> {assetLinkInfo.asset.condition}
                    </div>
                    <div className="element-actions">
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => window.open('/assets', '_blank')}
                      >
                        📜 View in Asset Inventory
                      </button>
                      <button
                        className="btn btn-sm btn-warning"
                        onClick={() => onOpenAssetTransfer?.(assetLinkInfo.asset.id, projectId)}
                      >
                        📦 Transfer Asset
                      </button>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => {
                          setLinkedElement(assetLinkInfo.asset);
                          setShowHistoryModal(true);
                        }}
                      >
                        📋 View History
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="asset-actions">
                    <div className="asset-not-linked-banner">
                      ⚠️ This element is not linked to any asset
                    </div>
                    <p className="help-text">Track this element across projects</p>
                    <div className="action-buttons">
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => onOpenAssetRegistration?.(selectedElements[0].id, selectedElements[0].name, selectedElements[0].type, selectedElements[0].properties, projectId)}
                      >
                        ➕ Register New Asset
                      </button>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => onOpenAssetLinking?.(selectedElements[0].id, selectedElements[0].name, projectId)}
                      >
                        🔗 Link Existing Asset
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Inspection Form with Tabs */}
          <div className="card">
            <div className="card-header">
              <h3>TW Material Passport</h3>
              <button onClick={clearInspection} className="btn btn-sm btn-error">
                Clear
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="tab-navigation">
              <button
                className={`tab-button ${activeTab === 'basic' ? 'active' : ''}`}
                onClick={() => setActiveTab('basic')}
              >
                Basic
              </button>
              <button
                className={`tab-button ${activeTab === 'technical' ? 'active' : ''}`}
                onClick={() => setActiveTab('technical')}
              >
                Technical
              </button>
              <button
                className={`tab-button ${activeTab === 'commercial' ? 'active' : ''}`}
                onClick={() => setActiveTab('commercial')}
              >
                Commercial
              </button>
              <button
                className={`tab-button ${activeTab === 'quality' ? 'active' : ''}`}
                onClick={() => setActiveTab('quality')}
              >
                Quality
              </button>
              <button
                className={`tab-button ${activeTab === 'stakeholders' ? 'active' : ''}`}
                onClick={() => setActiveTab('stakeholders')}
              >
                Stakeholders
              </button>
            </div>

            <div className="card-body">
              {activeTab === 'basic' && renderBasicTab()}
              {activeTab === 'technical' && renderTechnicalTab()}
              {activeTab === 'commercial' && renderCommercialTab()}
              {activeTab === 'quality' && renderQualityTab()}
              {activeTab === 'stakeholders' && renderStakeholdersTab()}

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
            <h3>TW Material Passport</h3>
            <p>
              Click any temporary works element to inspect its properties and manage its Material Passport data. Hold Shift and click to select multiple elements for batch inspection.
            </p>

            <div className="feature-list">
              <div className="feature-item">
                {isOnline ? `🟢 Connected to project ${projectId}` : '🔴 Database offline'}
              </div>
              <div className="feature-item">📋 TW Material Passport tracking</div>
              <div className="feature-item">🔄 Circular Construction support</div>
              <div className="feature-item">👥 Multi-stakeholder workflow</div>
              <div className="feature-item">📊 Complete TW lifecycle data</div>
              <div className="feature-item">🎯 Multi-selection batch inspection</div>
              <div className="feature-item">📁 Export for reuse analysis</div>
            </div>
          </div>
        </div>
      )}

      {/* Element Management Modals */}
      {selectedElements.length === 1 && (
        <>
          {linkedElement && showTransferModal && (
            <ElementTransferWorkflow
              elementId={linkedElement.id}
              currentProjectId={projectId}
              onClose={() => setShowTransferModal(false)}
              onTransferInitiated={() => {
                setShowTransferModal(false);
              }}
            />
          )}

          {linkedElement && showHistoryModal && (
            <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
              <div className="modal-content-history" onClick={(e) => e.stopPropagation()}>
                <ElementHistoryPanel
                  elementId={linkedElement.id}
                  onClose={() => setShowHistoryModal(false)}
                />
              </div>
            </div>
          )}
        </>
      )}

      <style jsx>{`
        .inspection-panel {
          background: var(--color-white);
          border-left: var(--border-width) solid var(--color-gray-200);
          display: flex;
          flex-direction: column;
          min-width: 380px;
          overflow: hidden;
          position: relative;
        }

        .resize-handle {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          background: transparent;
          cursor: col-resize;
          z-index: 10000;
          pointer-events: all;
          user-select: none;
          transition: all 0.2s ease;
        }

        .resize-handle:hover {
          background: rgba(255, 102, 0, 0.5);
          width: 6px;
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
          min-height: 0; /* Changed from height: 0 to min-height: 0 */
        }

        .card {
          background: var(--color-white);
          border-radius: var(--border-radius);
          border: var(--border-width) solid var(--color-gray-200);
          box-shadow: var(--shadow-sm);
          flex-shrink: 0;
          max-height: none; /* Ensure cards can grow */
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-md);
          border-bottom: var(--border-width) solid var(--color-gray-200);
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .card-body {
          padding: var(--space-md);
          max-height: 60vh; /* Limit the card body height */
          overflow-y: auto; /* Make card body scrollable */
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

        .asset-linked-banner {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: var(--space-sm) var(--space-md);
          border-radius: var(--border-radius);
          margin-bottom: var(--space-md);
          font-weight: 600;
          text-align: center;
        }

        .asset-not-linked-banner {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
          padding: var(--space-sm) var(--space-md);
          border-radius: var(--border-radius);
          margin-bottom: var(--space-md);
          font-weight: 600;
          text-align: center;
        }

        .linked-element-info {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-xs) 0;
          border-bottom: 1px solid var(--color-gray-100);
        }

        .info-row strong {
          color: var(--color-gray-700);
          font-size: var(--font-size-sm);
        }

        .element-actions {
          display: flex;
          gap: var(--space-sm);
          margin-top: var(--space-md);
        }

        .asset-actions {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }

        .asset-actions .help-text {
          color: var(--color-gray-600);
          font-size: var(--font-size-sm);
          margin: 0;
        }

        .action-buttons {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }

        .loading-state {
          padding: var(--space-md);
          text-align: center;
          color: var(--color-gray-600);
          font-style: italic;
        }

        .multi-element-summary {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .summary-header {
          display: flex;
          flex-direction: column;
          gap: var(--space-xs);
          padding: var(--space-sm);
          background: var(--color-primary);
          color: var(--color-white);
          border-radius: var(--border-radius);
          text-align: center;
        }

        .summary-count {
          font-size: var(--font-size-base);
          font-weight: 600;
        }

        .summary-note {
          font-size: var(--font-size-xs);
          opacity: 0.9;
        }

        .element-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-xs);
          max-height: 200px;
          overflow-y: auto;
        }

        .element-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-xs) var(--space-sm);
          background: var(--color-gray-50);
          border-radius: var(--border-radius);
          border: var(--border-width) solid var(--color-gray-200);
        }

        .element-item.more-elements {
          justify-content: center;
          font-style: italic;
          color: var(--color-gray-600);
          background: var(--color-gray-100);
        }

        .element-item .element-name {
          font-size: var(--font-size-sm);
          font-weight: 500;
          color: var(--color-gray-900);
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .element-id {
          font-size: var(--font-size-xs);
          font-family: monospace;
          color: var(--color-gray-500);
          background: var(--color-gray-200);
          padding: 2px 6px;
          border-radius: 4px;
        }

        .tab-navigation {
          display: flex;
          border-bottom: var(--border-width) solid var(--color-gray-200);
          overflow-x: auto;
        }

        .tab-button {
          padding: var(--space-sm) var(--space-md);
          border: none;
          background: transparent;
          color: var(--color-gray-600);
          font-size: var(--font-size-sm);
          font-weight: 500;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .tab-button:hover {
          color: var(--color-primary);
          background: var(--color-gray-50);
        }

        .tab-button.active {
          color: var(--color-primary);
          border-bottom-color: var(--color-primary);
          background: var(--color-white);
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
          line-height: 1.4;
          word-wrap: break-word;
          overflow-wrap: break-word;
          white-space: normal;
        }

        .details-section {
          margin-top: var(--space-md);
          border: var(--border-width) solid var(--color-gray-200);
          border-radius: var(--border-radius);
          overflow: hidden;
        }

        .details-section[open] {
          border-color: var(--color-primary-light);
        }

        .details-header {
          cursor: pointer;
          padding: var(--space-sm) var(--space-md);
          background: var(--color-gray-100);
          font-size: var(--font-size-sm);
          font-weight: 600;
          color: var(--color-gray-700);
          user-select: none;
          transition: all 0.2s ease;
          list-style: none;
          display: flex;
          align-items: center;
          gap: var(--space-xs);
        }

        .details-header:hover {
          background: var(--color-gray-200);
          color: var(--color-gray-900);
        }

        .details-header::before {
          content: '▶';
          display: inline-block;
          width: 12px;
          font-size: 10px;
          transition: transform 0.2s ease;
        }

        .details-section[open] .details-header::before {
          transform: rotate(90deg);
        }

        .details-section .property-list {
          padding: var(--space-sm) var(--space-md);
          background: var(--color-white);
        }

        .details-section .property-item {
          padding: var(--space-xs) 0;
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

        .form-select {
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

        .form-select:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(255, 102, 0, 0.1);
        }

        .form-select:disabled {
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
          max-width: 320px;
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
            position: relative;
            top: auto;
            left: auto;
            right: auto;
            bottom: auto;
            flex: 0 0 auto;
            min-width: unset;
            max-width: unset;
            width: 100% !important;
            height: auto !important;
            max-height: 50vh;
            border-left: none;
            border-top: var(--border-width) solid var(--color-gray-200);
            z-index: 1;
            background: var(--color-white);
          }

          .resize-handle {
            display: none;
          }

          .panel-header {
            position: sticky;
            top: 0;
            background: var(--color-gray-50);
            z-index: 10;
            flex-direction: row;
            align-items: center;
            gap: var(--space-sm);
            border-bottom: var(--border-width) solid var(--color-gray-200);
            flex-shrink: 0;
          }

          .header-left {
            flex: 1;
          }

          .header-actions {
            flex-shrink: 0;
            justify-content: flex-end;
          }

          .panel-content {
            flex: 1;
            height: auto;
            max-height: 40vh;
            min-height: 0;
            overflow-y: auto;
            overflow-x: hidden;
            padding: var(--space-md);
            -webkit-overflow-scrolling: touch;
          }

          .card {
            margin-bottom: var(--space-md);
            flex-shrink: 0;
          }

          .card-body {
            max-height: none;
            overflow-y: visible;
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
            height: 100%;
            overflow-y: auto;
          }

          .tab-navigation {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            flex-shrink: 0;
          }

          .tab-button {
            min-width: 80px;
            flex-shrink: 0;
          }

          .multi-element-summary .element-list {
            max-height: 150px;
            overflow-y: auto;
          }
        }

        /* Custom scrollbar for panel content */
        .panel-content::-webkit-scrollbar,
        .card-body::-webkit-scrollbar {
          width: 6px;
        }

        .panel-content::-webkit-scrollbar-track,
        .card-body::-webkit-scrollbar-track {
          background: var(--color-gray-100);
        }

        .panel-content::-webkit-scrollbar-thumb,
        .card-body::-webkit-scrollbar-thumb {
          background: var(--color-gray-400);
          border-radius: 3px;
        }

        .panel-content::-webkit-scrollbar-thumb:hover,
        .card-body::-webkit-scrollbar-thumb:hover {
          background: var(--color-gray-500);
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Button styles */
        .btn {
          padding: var(--space-xs) var(--space-sm);
          border: var(--border-width) solid transparent;
          border-radius: var(--border-radius);
          font-size: var(--font-size-sm);
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: var(--space-xs);
        }

        .btn-sm {
          padding: calc(var(--space-xs) * 0.75) var(--space-sm);
          font-size: var(--font-size-xs);
        }

        .btn-secondary {
          background: var(--color-gray-100);
          color: var(--color-gray-700);
          border-color: var(--color-gray-200);
        }

        .btn-secondary:hover {
          background: var(--color-gray-200);
          color: var(--color-gray-800);
        }

        .btn-error {
          background: var(--color-error);
          color: white;
        }

        .btn-error:hover {
          background: #dc2626;
        }
      `}</style>
    </div>
  );
}