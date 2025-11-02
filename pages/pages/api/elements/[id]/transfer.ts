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
  console.log(`📡 /api/elements/${id}/transfer called: ${req.method}`);

  const user = await getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    if (req.method === 'POST') {
      const {
        destinationProjectId,
        transferCondition,
        conditionNotes,
        transferInspectionId,
      } = req.body;

      if (!destinationProjectId || !transferCondition) {
        return res.status(400).json({
          error: 'Missing required fields: destinationProjectId, transferCondition'
        });
      }

      const [element] = await db
        .select()
        .from(elements)
        .where(eq(elements.id, id as string));

      if (!element) {
        return res.status(404).json({ error: 'Element not found' });
      }

      if (element.status !== 'active') {
        return res.status(400).json({
          error: `Element cannot be transferred. Current status: ${element.status}`
        });
      }

      await db
        .update(elements)
        .set({
          status: 'in_transit',
          updatedAt: new Date(),
        })
        .where(eq(elements.id, id as string));

      const [currentHistory] = await db
        .select()
        .from(elementProjectHistory)
        .where(
          and(
            eq(elementProjectHistory.elementId, id as string),
            eq(elementProjectHistory.status, 'active')
          )
        );

      if (currentHistory) {
        await db
          .update(elementProjectHistory)
          .set({
            status: 'transferred_out',
            deactivatedDate: new Date(),
            transferredCondition: transferCondition,
            transferInspectionId,
            updatedAt: new Date(),
          })
          .where(eq(elementProjectHistory.id, currentHistory.id));
      }

      const [newHistory] = await db
        .insert(elementProjectHistory)
        .values({
          elementId: id as string,
          projectId: destinationProjectId,
          transferredFromProjectId: element.currentProjectId || undefined,
          transferRequestedByUserId: user.id,
          transferRequestDate: new Date(),
          status: 'pending_approval',
          conditionNotes,
          sourceProjectManagerApproval: false,
          destinationProjectManagerApproval: false,
        })
        .returning();

      console.log(`✅ Transfer initiated for element ${element.assetNumber}`);
      return res.status(200).json({
        message: 'Transfer initiated. Awaiting project manager approvals.',
        historyRecord: newHistory,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error(`❌ Error in transfer:`, error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
