import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../../server/storage';
import { elementSpeckleMappings, elements } from '../../../../shared/schema';
import { getCurrentUser } from '../../../../server/apiAuth';
import { eq } from 'drizzle-orm';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { speckleElementId } = req.query;
  console.log(`📡 /api/elements/check-linking/${speckleElementId} called: ${req.method}`);

  const user = await getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const mappings = await db
      .select({
        mappingId: elementSpeckleMappings.id,
        elementId: elementSpeckleMappings.elementId,
        projectId: elementSpeckleMappings.projectId,
        isActive: elementSpeckleMappings.isActive,
        assetNumber: elements.assetNumber,
        assetStatus: elements.status,
        assetCondition: elements.currentCondition,
        assetId: elements.id,
      })
      .from(elementSpeckleMappings)
      .leftJoin(elements, eq(elementSpeckleMappings.elementId, elements.id))
      .where(eq(elementSpeckleMappings.speckleElementId, speckleElementId as string));

    if (mappings.length === 0) {
      return res.status(200).json({ 
        linked: false,
        asset: null 
      });
    }

    // Return the first (should be only) mapping
    const mapping = mappings[0];
    
    console.log(`✅ Element ${speckleElementId} is linked to asset ${mapping.assetNumber}`);
    
    return res.status(200).json({
      linked: true,
      asset: {
        id: mapping.assetId,
        assetNumber: mapping.assetNumber,
        status: mapping.assetStatus,
        condition: mapping.assetCondition,
        projectId: mapping.projectId,
        isActive: mapping.isActive,
      },
    });
  } catch (error) {
    console.error(`❌ Error checking element linking:`, error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
