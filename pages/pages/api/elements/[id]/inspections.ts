import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../../server/storage';
import { inspections } from '../../../../shared/schema';
import { getCurrentUser } from '../../../../server/apiAuth';
import { eq, desc } from 'drizzle-orm';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  console.log(`📡 /api/elements/${id}/inspections called`);

  const user = await getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const elementInspections = await db
      .select()
      .from(inspections)
      .where(eq(inspections.globalElementId, id as string))
      .orderBy(desc(inspections.timestamp));

    console.log(`✅ Found ${elementInspections.length} inspections for element`);
    return res.status(200).json(elementInspections);
  } catch (error) {
    console.error(`❌ Error fetching inspections:`, error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
