import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../server/storage';
import { elements, elementProjectHistory, elementSpeckleMappings, inspections } from '../../../shared/schema';
import { getCurrentUser } from '../../../server/apiAuth';
import { eq } from 'drizzle-orm';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  console.log(`📡 /api/elements/${id} called: ${req.method}`);

  const user = await getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    if (req.method === 'GET') {
      const [element] = await db
        .select()
        .from(elements)
        .where(eq(elements.id, id as string));

      if (!element) {
        return res.status(404).json({ error: 'Element not found' });
      }

      return res.status(200).json(element);
    }

    if (req.method === 'PUT') {
      const updates = req.body;
      
      delete updates.id;
      delete updates.assetNumber;
      delete updates.qrCode;
      delete updates.createdAt;
      delete updates.createdByUserId;

      const [updatedElement] = await db
        .update(elements)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(elements.id, id as string))
        .returning();

      if (!updatedElement) {
        return res.status(404).json({ error: 'Element not found' });
      }

      console.log(`✅ Element updated: ${updatedElement.assetNumber}`);
      return res.status(200).json(updatedElement);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error(`❌ Error in /api/elements/${id}:`, error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
