const fs = require('fs').promises;
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'inspections.json');

async function readDatabase() {
  try {
    const data = await fs.readFile(dbPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.log('📁 Database not found, returning empty');
    return { inspections: [] };
  }
}

export default async function handler(req, res) {
  console.log('📡 Element inspection lookup:', req.query);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { elementId } = req.query;
    const { projectId } = req.query;

    if (!elementId) {
      return res.status(400).json({ success: false, error: 'elementId is required' });
    }

    const db = await readDatabase();
    const inspection = db.inspections.find(i => {
      const matchesElement = i.elementId === elementId;
      const matchesProject = !projectId || i.projectId === projectId;
      return matchesElement && matchesProject;
    }) || null;

    console.log(`🔍 Found inspection for ${elementId}:`, inspection ? 'YES' : 'NO');
    res.json({ success: true, data: inspection });

  } catch (error) {
    console.error('❌ Element lookup error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}