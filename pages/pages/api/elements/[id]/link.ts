import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../../server/storage';
import { elementSpeckleMappings, elements, elementProjectHistory } from '../../../../shared/schema';
import { getCurrentUser } from '../../../../server/apiAuth';
import { eq, and } from 'drizzle-orm';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  console.log(`📡 /api/elements/${id}/link called: ${req.method}`);

  const user = await getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    if (req.method === 'POST') {
      const {
        projectId,
        speckleElementId,
        speckleObjectUrl,
        notes,
      } = req.body;

      if (!projectId || !speckleElementId) {
        return res.status(400).json({
          error: 'Missing required fields: projectId, speckleElementId'
        });
      }

      // Get current element data
      const [element] = await db
        .select()
        .from(elements)
        .where(eq(elements.id, id as string));

      if (!element) {
        return res.status(404).json({ error: 'Element not found' });
      }

      // Deactivate previous Speckle mappings
      await db
        .update(elementSpeckleMappings)
        .set({ isActive: false })
        .where(
          and(
            eq(elementSpeckleMappings.elementId, id as string),
            eq(elementSpeckleMappings.isActive, true)
          )
        );

      // Create new Speckle mapping
      const [newMapping] = await db
        .insert(elementSpeckleMappings)
        .values({
          elementId: id as string,
          projectId,
          speckleElementId,
          speckleObjectUrl,
          mappedByUserId: user.id,
          isActive: true,
          notes,
        })
        .returning();

      // If linking to a different project, complete any pending transfer
      if (element.currentProjectId !== projectId) {
        console.log(`🔄 Completing transfer: ${element.currentProjectId} → ${projectId}`);

        // Update element to active in new project
        await db
          .update(elements)
          .set({
            status: 'active',
            currentProjectId: projectId,
            updatedAt: new Date(),
          })
          .where(eq(elements.id, id as string));

        // Find and update pending transfer history
        const [pendingTransfer] = await db
          .select()
          .from(elementProjectHistory)
          .where(
            and(
              eq(elementProjectHistory.elementId, id as string),
              eq(elementProjectHistory.projectId, projectId),
              eq(elementProjectHistory.status, 'pending_approval')
            )
          );

        if (pendingTransfer) {
          await db
            .update(elementProjectHistory)
            .set({
              status: 'active',
              activatedDate: new Date(),
              sourceProjectManagerApproval: true,
              destinationProjectManagerApproval: true,
              destinationProjectManagerApprovedByUserId: user.id,
              destinationProjectManagerApprovalDate: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(elementProjectHistory.id, pendingTransfer.id));
          
          console.log(`✅ Transfer completed and approved`);
        } else {
          // No pending transfer, create new history record
          await db.insert(elementProjectHistory).values({
            elementId: id as string,
            projectId,
            transferredFromProjectId: element.currentProjectId || undefined,
            status: 'active',
            activatedDate: new Date(),
            transferredByUserId: user.id,
          });
          
          console.log(`✅ Asset moved to new project ${projectId}`);
        }
      }

      console.log(`✅ Element linked to Speckle element ${speckleElementId}`);
      return res.status(201).json(newMapping);
    }

    if (req.method === 'GET') {
      const { projectId } = req.query;

      // Build where conditions
      const whereConditions = [eq(elementSpeckleMappings.elementId, id as string)];
      if (projectId) {
        whereConditions.push(eq(elementSpeckleMappings.projectId, projectId as string));
      }

      const mappings = await db
        .select()
        .from(elementSpeckleMappings)
        .where(and(...whereConditions));

      return res.status(200).json(mappings);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error(`❌ Error in link:`, error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
