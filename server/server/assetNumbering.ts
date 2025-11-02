import { db } from './storage';
import { elements } from '../shared/schema';
import { sql } from 'drizzle-orm';

export async function generateAssetNumber(ifcType: string): Promise<string> {
  const existingElements = await db
    .select({ assetNumber: elements.assetNumber })
    .from(elements)
    .where(sql`${elements.ifcType} = ${ifcType} AND ${elements.assetNumber} LIKE ${ifcType + '-%'}`)
    .orderBy(sql`${elements.assetNumber} DESC`)
    .limit(1);
  
  let nextNumber = 1;
  
  if (existingElements.length > 0) {
    const lastAssetNumber = existingElements[0].assetNumber;
    const parts = lastAssetNumber.split('-');
    if (parts.length === 2) {
      const lastNumber = parseInt(parts[1], 10);
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }
  }
  
  const paddedNumber = nextNumber.toString().padStart(6, '0');
  return `${ifcType}-${paddedNumber}`;
}

export function generateQRCode(assetNumber: string): string {
  return `TWX-ASSET-${assetNumber}`;
}

export { COMMON_IFC_TYPES, CONDITION_TYPES, ELEMENT_STATUS, INSPECTION_TYPES } from '../shared/constants';
