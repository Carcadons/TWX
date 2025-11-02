import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../../server/storage';
import { elements } from '../../../../shared/schema';
import { getCurrentUser } from '../../../../server/apiAuth';
import { eq } from 'drizzle-orm';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { code } = req.query;
  console.log(`📡 /api/elements/qr/${code} called: ${req.method}`);

  const user = await getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    if (req.method === 'GET') {
      const [element] = await db
        .select()
        .from(elements)
        .where(eq(elements.qrCode, code as string));

      if (!element) {
        return res.status(404).json({ error: 'Element not found for QR code' });
      }

      console.log(`✅ Element found by QR: ${element.assetNumber}`);
      return res.status(200).json(element);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error(`❌ Error in /api/elements/qr/${code}:`, error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
