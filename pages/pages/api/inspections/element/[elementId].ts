import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../../server/db';
import { inspections } from '../../../../shared/schema';
import { eq, and } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('📡 Element inspection lookup:', req.query);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { elementId, projectId } = req.query;

    if (!elementId || typeof elementId !== 'string') {
      return res.status(400).json({ success: false, error: 'elementId is required' });
    }

    let inspection;
    if (projectId && typeof projectId === 'string') {
      // Find by both element ID and project ID
      const result = await db.select().from(inspections).where(
        and(
          eq(inspections.elementId, elementId),
          eq(inspections.projectId, projectId)
        )
      ).limit(1);
      inspection = result.length > 0 ? result[0] : null;
    } else {
      // Find by element ID only
      const result = await db.select().from(inspections).where(
        eq(inspections.elementId, elementId)
      ).limit(1);
      inspection = result.length > 0 ? result[0] : null;
    }

    console.log(`🔍 Found inspection for ${elementId}:`, inspection ? 'YES' : 'NO');
    res.json({ success: true, data: inspection });

  } catch (error) {
    console.error('❌ Element lookup error:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
}
