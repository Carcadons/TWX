const fs = require('fs').promises;
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'inspections.json');

async function readDatabase() {
  try {
    const data = await fs.readFile(dbPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return { inspections: [] };
  }
}

export default async function handler(req, res) {
  console.log('📡 /api/export called');

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { projectId } = req.query;
    const db = await readDatabase();

    const inspections = projectId 
      ? db.inspections.filter(i => i.projectId === projectId)
      : db.inspections;

    const exportData = {
      projectName: "TWX Inspection Export",
      projectId: projectId || "all",
      exportDate: new Date().toISOString(),
      totalInspections: inspections.length,
      inspections
    };

    res.json({ success: true, data: exportData });
  } catch (error) {
    console.error('❌ Export error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}