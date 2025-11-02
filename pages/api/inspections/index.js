const fs = require('fs').promises;
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'inspections.json');

async function ensureDatabase() {
  try {
    // Check if file exists and is readable
    await fs.access(dbPath);

    // Try to read and parse the file
    const data = await fs.readFile(dbPath, 'utf-8');

    // If file is empty or invalid JSON, recreate it
    if (!data.trim()) {
      throw new Error('Empty file');
    }

    JSON.parse(data); // Test if valid JSON
    console.log('✅ Database file is valid');

  } catch (error) {
    console.log('📁 Creating/fixing database file...');

    const defaultDb = {
      inspections: [],
      metadata: {
        created: new Date().toISOString(),
        version: '1.0.0'
      }
    };

    // Create directory if it doesn't exist
    await fs.mkdir(path.dirname(dbPath), { recursive: true });

    // Write the default database
    await fs.writeFile(dbPath, JSON.stringify(defaultDb, null, 2));
    console.log('✅ Database initialized');
  }
}

async function readDatabase() {
  await ensureDatabase();

  try {
    const data = await fs.readFile(dbPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Failed to read database, recreating...');

    // If we still can't read it, recreate
    const defaultDb = { inspections: [] };
    await fs.writeFile(dbPath, JSON.stringify(defaultDb, null, 2));
    return defaultDb;
  }
}

async function writeDatabase(db) {
  try {
    await fs.writeFile(dbPath, JSON.stringify(db, null, 2));
    console.log('✅ Database written successfully');
  } catch (error) {
    console.error('❌ Failed to write database:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  console.log('📡 /api/inspections called:', req.method);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'POST') {
      const inspectionData = req.body;
      console.log('💾 Saving inspection:', inspectionData);

      if (!inspectionData.elementId) {
        return res.status(400).json({ 
          success: false, 
          error: 'elementId is required' 
        });
      }

      // Read current database
      const db = await readDatabase();

      // Check if inspection already exists for this element
      const existingIndex = db.inspections.findIndex(
        i => i.elementId === inspectionData.elementId && i.projectId === inspectionData.projectId
      );

      if (existingIndex >= 0) {
        // Update existing inspection
        const existing = db.inspections[existingIndex];
        const updated = {
          ...existing,
          ...inspectionData,
          timestamp: new Date().toISOString(),
          version: (existing.version || 0) + 1
        };

        db.inspections[existingIndex] = updated;
        await writeDatabase(db);

        console.log('✅ Inspection updated:', updated.id);
        res.json({ success: true, data: updated });
      } else {
        // Create new inspection
        const newInspection = {
          ...inspectionData,
          id: `insp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          version: 1
        };

        db.inspections.push(newInspection);
        await writeDatabase(db);

        console.log('✅ New inspection created:', newInspection.id);
        res.json({ success: true, data: newInspection });
      }

    } else if (req.method === 'GET') {
      const { projectId } = req.query;
      const db = await readDatabase();

      const inspections = projectId 
        ? db.inspections.filter(i => i.projectId === projectId)
        : db.inspections;

      res.json({ success: true, data: inspections });
    } else {
      res.status(405).json({ success: false, error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('❌ API Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}