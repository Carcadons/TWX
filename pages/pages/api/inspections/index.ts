import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../server/db';
import { inspections } from '../../../shared/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '../../../server/apiAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('📡 /api/inspections called:', req.method);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'POST') {
      const inspectionData = req.body;
      console.log('💾 Saving inspection:', inspectionData);

      // Get the authenticated user
      const currentUser = getCurrentUser(req);
      const userId = currentUser?.id || 'anonymous';
      
      console.log('👤 User creating/updating inspection:', userId);

      if (!inspectionData.elementId) {
        return res.status(400).json({ 
          success: false, 
          error: 'elementId is required' 
        });
      }

      if (!inspectionData.projectId || inspectionData.projectId.trim() === '') {
        return res.status(400).json({ 
          success: false, 
          error: 'projectId is required' 
        });
      }

      // Check if inspection already exists for this element
      const existing = await db.select().from(inspections).where(
        and(
          eq(inspections.elementId, inspectionData.elementId),
          eq(inspections.projectId, inspectionData.projectId)
        )
      ).limit(1);

      if (existing.length > 0) {
        // Update existing inspection
        // Strip out any client-supplied user tracking fields to prevent tampering
        const { createdByUserId: _, lastModifiedByUserId: __, ...safeData } = inspectionData;
        
        const updated = {
          ...safeData,
          timestamp: new Date(),
          version: (existing[0].version || 0) + 1,
          // Preserve the original creator, update the modifier
          createdByUserId: existing[0].createdByUserId,
          lastModifiedByUserId: userId
        };

        await db.update(inspections)
          .set(updated)
          .where(eq(inspections.id, existing[0].id));

        const result = await db.select().from(inspections).where(eq(inspections.id, existing[0].id)).limit(1);

        console.log('✅ Inspection updated:', result[0].id);
        res.json({ success: true, data: result[0] });
      } else {
        // Create new inspection
        // Strip out any client-supplied user tracking fields to prevent tampering
        const { createdByUserId: _, lastModifiedByUserId: __, ...safeData } = inspectionData;
        
        const newInspection = {
          id: `insp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...safeData,
          inspector: inspectionData.inspector || '',
          status: inspectionData.status || '',
          notes: inspectionData.notes || '',
          date: inspectionData.date || new Date().toISOString().split('T')[0],
          lastModifiedBy: inspectionData.lastModifiedBy || 'user',
          timestamp: new Date(),
          version: 1,
          // Server-side tracking only
          createdByUserId: userId,
          lastModifiedByUserId: userId,
          
          // All optional fields
          designPackageNumber: inspectionData.designPackageNumber || null,
          designPackageDescription: inspectionData.designPackageDescription || null,
          riskCategories: inspectionData.riskCategories || null,
          plannedErectionDate: inspectionData.plannedErectionDate || null,
          plannedDismantleDate: inspectionData.plannedDismantleDate || null,
          actualErectionDate: inspectionData.actualErectionDate || null,
          actualDismantleDate: inspectionData.actualDismantleDate || null,
          plannedLocation: inspectionData.plannedLocation || null,
          actualLocation: inspectionData.actualLocation || null,
          environmentalConditions: inspectionData.environmentalConditions || null,
          loadingCriteria: inspectionData.loadingCriteria || null,
          surveyData: inspectionData.surveyData || null,
          materialRequirements: inspectionData.materialRequirements || null,
          installationMethodStatement: inspectionData.installationMethodStatement || null,
          removalMethodStatement: inspectionData.removalMethodStatement || null,
          estimatedQuantities: inspectionData.estimatedQuantities || null,
          estimatedCostDesign: inspectionData.estimatedCostDesign || null,
          estimatedCostConstruction: inspectionData.estimatedCostConstruction || null,
          procurementReference: inspectionData.procurementReference || null,
          budgetComparison: inspectionData.budgetComparison || null,
          materialCostCodes: inspectionData.materialCostCodes || null,
          twcCheckingRemarks: inspectionData.twcCheckingRemarks || null,
          iceCheckingRemarks: inspectionData.iceCheckingRemarks || null,
          materialCertificates: inspectionData.materialCertificates || null,
          labTestResults: inspectionData.labTestResults || null,
          usageHistory: inspectionData.usageHistory || null,
          overstressingRecord: inspectionData.overstressingRecord || null,
          responsibleSitePerson: inspectionData.responsibleSitePerson || null,
          temporaryWorksCoordinator: inspectionData.temporaryWorksCoordinator || null,
          temporaryWorksDesigner: inspectionData.temporaryWorksDesigner || null,
          independentCheckingEngineer: inspectionData.independentCheckingEngineer || null,
          designDocumentationRef: inspectionData.designDocumentationRef || null,
          approvalDate: inspectionData.approvalDate || null,
          constructionCompletionDate: inspectionData.constructionCompletionDate || null,
          permitToLoadDate: inspectionData.permitToLoadDate || null,
          permitToRemoveDate: inspectionData.permitToRemoveDate || null,
        };

        await db.insert(inspections).values(newInspection);

        console.log('✅ New inspection created:', newInspection.id);
        res.json({ success: true, data: newInspection });
      }

    } else if (req.method === 'GET') {
      const { projectId } = req.query;

      let allInspections;
      if (projectId && typeof projectId === 'string') {
        allInspections = await db.select().from(inspections).where(eq(inspections.projectId, projectId));
      } else {
        allInspections = await db.select().from(inspections);
      }

      res.json({ success: true, data: allInspections });
    } else {
      res.status(405).json({ success: false, error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('❌ API Error:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
}
