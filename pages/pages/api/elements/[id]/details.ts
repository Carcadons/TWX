import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../../server/storage';
import { elements, elementSpeckleMappings, inspections, projects } from '../../../../shared/schema';
import { getCurrentUser } from '../../../../server/apiAuth';
import { eq, inArray } from 'drizzle-orm';
import QRCode from 'qrcode';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  console.log(`📡 /api/elements/${id}/details called: ${req.method}`);

  const user = await getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const [element] = await db
      .select()
      .from(elements)
      .where(eq(elements.id, id as string));

    if (!element) {
      return res.status(404).json({ error: 'Element not found' });
    }

    const mappings = await db
      .select({
        id: elementSpeckleMappings.id,
        projectId: elementSpeckleMappings.projectId,
        speckleElementId: elementSpeckleMappings.speckleElementId,
        speckleObjectUrl: elementSpeckleMappings.speckleObjectUrl,
        mappedDate: elementSpeckleMappings.mappedDate,
        isActive: elementSpeckleMappings.isActive,
        notes: elementSpeckleMappings.notes,
        projectName: projects.name,
      })
      .from(elementSpeckleMappings)
      .leftJoin(projects, eq(elementSpeckleMappings.projectId, projects.id))
      .where(eq(elementSpeckleMappings.elementId, id as string));

    const speckleElementIds = mappings.map(m => m.speckleElementId);
    
    const linkedInspections = speckleElementIds.length > 0
      ? await db
          .select()
          .from(inspections)
          .where(inArray(inspections.elementId, speckleElementIds))
      : [];

    let qrCodeDataUrl: string | null = null;
    if (element.qrCode) {
      try {
        qrCodeDataUrl = await QRCode.toDataURL(element.qrCode, {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        });
      } catch (qrError) {
        console.error('❌ Error generating QR code:', qrError);
      }
    }

    console.log(`✅ Element details: ${element.assetNumber} with ${mappings.length} mappings and ${linkedInspections.length} inspections`);
    
    return res.status(200).json({
      element,
      qrCodeDataUrl,
      mappings,
      inspections: linkedInspections,
    });
  } catch (error) {
    console.error(`❌ Error in /api/elements/${id}/details:`, error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
