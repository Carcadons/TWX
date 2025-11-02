import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../server/storage';
import { elements, elementProjectHistory, elementSpeckleMappings } from '../../../shared/schema';
import { getCurrentUser } from '../../../server/apiAuth';
import { generateAssetNumber, generateQRCode } from '../../../server/assetNumbering';
import { eq, and, sql, type SQL } from 'drizzle-orm';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log(`📡 /api/elements called: ${req.method}`);

  const user = await getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    if (req.method === 'GET') {
      const { projectId, status, ifcType } = req.query;

      const conditions: SQL[] = [];
      if (projectId) {
        conditions.push(eq(elements.currentProjectId, projectId as string));
      }
      if (status) {
        conditions.push(eq(elements.status, status as string));
      }
      if (ifcType) {
        conditions.push(eq(elements.ifcType, ifcType as string));
      }

      const result = conditions.length > 0
        ? await db.select().from(elements).where(and(...conditions))
        : await db.select().from(elements);
      
      console.log(`✅ Found ${result.length} elements with filters:`, { projectId, status, ifcType });
      return res.status(200).json(result);
    }

    if (req.method === 'POST') {
      const {
        ifcType,
        assetType,
        category,
        description,
        manufacturer,
        serialNumber,
        specifications,
        purchaseDate,
        purchaseValue,
        currentCondition,
        currentProjectId,
        remarks,
      } = req.body;

      if (!ifcType || !currentProjectId || !currentCondition) {
        return res.status(400).json({
          error: 'Missing required fields: ifcType, currentProjectId, currentCondition'
        });
      }

      const assetNumber = await generateAssetNumber(ifcType);
      const qrCode = generateQRCode(assetNumber);

      const [newElement] = await db
        .insert(elements)
        .values({
          assetNumber,
          ifcType,
          assetType,
          category,
          description,
          manufacturer,
          serialNumber,
          qrCode,
          specifications,
          purchaseDate,
          purchaseValue,
          currentCondition,
          currentProjectId,
          status: 'active',
          remarks,
          createdByUserId: user.id,
          updatedAt: new Date(),
        })
        .returning();

      await db.insert(elementProjectHistory).values({
        elementId: newElement.id,
        projectId: currentProjectId,
        status: 'active',
        activatedDate: new Date(),
        receivedCondition: currentCondition,
        transferRequestedByUserId: user.id,
      });

      console.log(`✅ Element registered: ${assetNumber}`);
      return res.status(201).json(newElement);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('❌ Error in /api/elements:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
