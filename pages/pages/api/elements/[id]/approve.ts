import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../../server/storage';
import { elementProjectHistory } from '../../../../shared/schema';
import { getCurrentUser } from '../../../../server/apiAuth';
import { eq, and } from 'drizzle-orm';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  console.log(`📡 /api/elements/${id}/approve called: ${req.method}`);

  const user = await getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    if (req.method === 'POST') {
      const { projectId, approvalType } = req.body;

      if (!projectId || !approvalType) {
        return res.status(400).json({
          error: 'Missing required fields: projectId, approvalType (source or destination)'
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
        return res.status(404).json({
          error: 'No pending transfer approval found'
        });
      }

      const updates: any = {
        updatedAt: new Date(),
      };

      if (approvalType === 'source') {
        updates.sourceProjectManagerApproval = true;
        updates.sourceProjectManagerApprovedByUserId = user.id;
        updates.sourceProjectManagerApprovalDate = new Date();
      } else if (approvalType === 'destination') {
        updates.destinationProjectManagerApproval = true;
        updates.destinationProjectManagerApprovedByUserId = user.id;
        updates.destinationProjectManagerApprovalDate = new Date();
      } else {
        return res.status(400).json({
          error: 'Invalid approvalType. Must be "source" or "destination"'
        });
      }

      const [updatedHistory] = await db
        .update(elementProjectHistory)
        .set(updates)
        .where(eq(elementProjectHistory.id, pendingHistory.id))
        .returning();

      console.log(`✅ ${approvalType} project manager approved transfer`);
      return res.status(200).json({
        message: `${approvalType} project manager approval recorded`,
        historyRecord: updatedHistory,
        bothApproved: updatedHistory.sourceProjectManagerApproval && updatedHistory.destinationProjectManagerApproval,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error(`❌ Error in approve:`, error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
