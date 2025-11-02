import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../../server/storage';
import { elements, elementProjectHistory } from '../../../../shared/schema';
import { getCurrentUser } from '../../../../server/apiAuth';
import { eq, and } from 'drizzle-orm';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  console.log(`📡 /api/elements/${id}/receive called: ${req.method}`);

  const user = await getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    if (req.method === 'POST') {
      const {
        projectId,
        receivedCondition,
        conditionNotes,
        receiptInspectionId,
        actualLocation,
      } = req.body;

      if (!projectId || !receivedCondition) {
        return res.status(400).json({
          error: 'Missing required fields: projectId, receivedCondition'
        });
      }

      const [element] = await db
        .select()
        .from(elements)
        .where(eq(elements.id, id as string));

      if (!element) {
        return res.status(404).json({ error: 'Element not found' });
      }

      if (element.status !== 'in_transit') {
        return res.status(400).json({
          error: `Element must be in transit to receive. Current status: ${element.status}`
        });
      }

      const [pendingHistory] = await db
        .select()
        .from(elementProjectHistory)
        .where(
          and(
            eq(elementProjectHistory.elementId, id as string),
            eq(elementProjectHistory.projectId, projectId),
            eq(elementProjectHistory.status, 'pending_approval')
          )
        );

      if (!pendingHistory) {
        return res.status(400).json({
          error: 'No pending transfer found for this project'
        });
      }

      if (!pendingHistory.sourceProjectManagerApproval || !pendingHistory.destinationProjectManagerApproval) {
        return res.status(400).json({
          error: 'Transfer requires approval from both project managers',
          approvals: {
            source: pendingHistory.sourceProjectManagerApproval,
            destination: pendingHistory.destinationProjectManagerApproval,
          }
        });
      }

      await db
        .update(elements)
        .set({
          status: 'active',
          currentProjectId: projectId,
          currentCondition: receivedCondition,
          updatedAt: new Date(),
        })
        .where(eq(elements.id, id as string));

      await db
        .update(elementProjectHistory)
        .set({
          status: 'active',
          activatedDate: new Date(),
          receivedCondition,
          conditionNotes,
          receiptInspectionId,
          actualLocation,
          updatedAt: new Date(),
        })
        .where(eq(elementProjectHistory.id, pendingHistory.id));

      console.log(`✅ Element ${element.assetNumber} received in project ${projectId}`);
      return res.status(200).json({
        message: 'Element received and activated',
        element,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error(`❌ Error in receive:`, error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
