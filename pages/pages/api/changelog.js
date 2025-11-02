import { promises as fs } from 'fs';
import path from 'path';

const changelogPath = path.join(process.cwd(), 'data', 'changelog.json');

async function ensureChangelog() {
  try {
    await fs.access(changelogPath);
    const data = await fs.readFile(changelogPath, 'utf-8');
    if (!data.trim()) {
      throw new Error('Empty file');
    }
    JSON.parse(data); // Test if valid JSON
    console.log('✅ Changelog file is valid');
  } catch (error) {
    console.log('📁 Creating changelog file...');

    const defaultChangelog = {
      changes: [],
      metadata: {
        lastUpdate: new Date().toISOString(),
        totalChanges: 0,
        currentVersion: "0.1.0"
      }
    };

    await fs.mkdir(path.dirname(changelogPath), { recursive: true });
    await fs.writeFile(changelogPath, JSON.stringify(defaultChangelog, null, 2));
    console.log('✅ Changelog initialized');
  }
}

async function readChangelog() {
  await ensureChangelog();
  try {
    const data = await fs.readFile(changelogPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Failed to read changelog:', error);
    return { changes: [], metadata: {} };
  }
}

export default async function handler(req, res) {
  console.log('📡 /api/changelog called:', req.method);

  if (req.method === 'GET') {
    try {
      const changelog = await readChangelog();
      res.status(200).json({
        success: true,
        changes: changelog.changes || [],
        metadata: changelog.metadata || {}
      });
    } catch (error) {
      console.error('❌ Error reading changelog:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to read changelog'
      });
    }
  } else {
    res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }
}
