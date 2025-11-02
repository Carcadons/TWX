import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../../server/storage';
import { elementProjectHistory, projects, inspections } from '../../../../shared/schema';
import { getCurrentUser } from '../../../../server/apiAuth';
import { eq, desc } from 'drizzle-orm';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  console.log(`📡 /api/elements/${id}/history called`);

  const user = await getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const history = await db
      .select({
        historyRecord: elementProjectHistory,
        project: projects,
      })
      .from(elementProjectHistory)
      .leftJoin(projects, eq(elementProjectHistory.projectId, projects.id))
      .where(eq(elementProjectHistory.elementId, id as string))
      .orderBy(desc(elementProjectHistory.activatedDate));

    console.log(`✅ Found ${history.length} history records`);
    return res.status(200).json(history);
  } catch (error) {
    console.error(`❌ Error fetching history:`, error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
