export const COMMON_IFC_TYPES = [
  'IfcBuildingElementProxy',
  'IfcMember',
  'IfcColumn',
  'IfcBeam',
  'IfcSlab',
  'IfcWall',
  'IfcElementAssembly',
  'IfcDiscreteAccessory',
  'IfcPlate',
  'IfcRailing',
] as const;

export const CONDITION_TYPES = [
  'Excellent',
  'Good',
  'Fair',
  'Poor',
] as const;

export const ELEMENT_STATUS = [
  'active',
  'in_transit',
  'in_storage',
  'retired',
  'scrapped',
] as const;

export const INSPECTION_TYPES = [
  'receipt',
  'periodic',
  'transfer',
  'final',
  'maintenance',
] as const;
