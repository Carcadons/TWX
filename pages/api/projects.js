const fs = require('fs').promises;
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'projects.json');

async function ensureDatabase() {
  try {
    await fs.access(dbPath);
    const data = await fs.readFile(dbPath, 'utf-8');
    if (!data.trim()) {
      throw new Error('Empty file');
    }
    JSON.parse(data); // Test if valid JSON
    console.log('✅ Projects database file is valid');
  } catch (error) {
    console.log('📁 Creating/fixing projects database file...');

    const defaultDb = {
      projects: [
        {
          id: "123",
          name: "Testing Structure",
          status: "active",
          speckleUrl: "https://app.speckle.systems/projects/6db9f977d5/models/ccbcddb5c0",
          createdAt: "2025-05-15T10:30:00Z",
          lastModified: "2025-06-09T14:22:00Z"
        }
      ],
      metadata: {
        version: "1.0.0",
        lastUpdate: new Date().toISOString(),
        totalProjects: 1
      }
    };

    await fs.mkdir(path.dirname(dbPath), { recursive: true });
    await fs.writeFile(dbPath, JSON.stringify(defaultDb, null, 2));
    console.log('✅ Projects database initialized');
  }
}

async function readDatabase() {
  await ensureDatabase();
  try {
    const data = await fs.readFile(dbPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Failed to read projects database:', error);
    return { projects: [], metadata: {} };
  }
}

async function writeDatabase(db) {
  try {
    await fs.writeFile(dbPath, JSON.stringify(db, null, 2));
    console.log('✅ Projects database written successfully');
  } catch (error) {
    console.error('❌ Failed to write projects database:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  console.log('📡 /api/projects called:', req.method, req.query);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      // Get all projects or a specific project by ID
      const { id } = req.query;
      const db = await readDatabase();

      if (id) {
        // Get specific project
        console.log('🔍 Looking for project with ID:', id);
        const project = db.projects.find(p => p.id === id);
        if (project) {
          console.log('✅ Project found:', project.name);
          res.json({ 
            success: true, 
            data: project 
          });
        } else {
          console.log('❌ Project not found with ID:', id);
          res.status(404).json({ 
            success: false, 
            error: 'Project not found' 
          });
        }
      } else {
        // Get all projects
        console.log('📋 Returning all projects:', db.projects.length);
        res.json({ 
          success: true, 
          data: db.projects,
          metadata: db.metadata 
        });
      }

    } else if (req.method === 'POST') {
      // Create new project
      const projectData = req.body;
      console.log('💾 Creating new project:', projectData);

      if (!projectData.name) {
        return res.status(400).json({ 
          success: false, 
          error: 'Project name is required' 
        });
      }

      if (!projectData.speckleUrl) {
        return res.status(400).json({ 
          success: false, 
          error: 'Speckle URL is required' 
        });
      }

      // Basic validation for Speckle URL format
      if (!projectData.speckleUrl.includes('speckle.systems/projects/')) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid Speckle URL format' 
        });
      }

      const db = await readDatabase();
      const newProject = {
        id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: projectData.name,
        status: projectData.status || 'active',
        speckleUrl: projectData.speckleUrl || '',
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      };

      db.projects.push(newProject);
      db.metadata.totalProjects = db.projects.length;
      db.metadata.lastUpdate = new Date().toISOString();

      await writeDatabase(db);
      console.log('✅ New project created:', newProject.id, newProject.name);
      res.json({ success: true, data: newProject });

    } else if (req.method === 'DELETE') {
      // Delete project
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ 
          success: false, 
          error: 'Project ID is required' 
        });
      }

      const db = await readDatabase();
      const projectIndex = db.projects.findIndex(p => p.id === id);

      if (projectIndex === -1) {
        return res.status(404).json({ 
          success: false, 
          error: 'Project not found' 
        });
      }

      const deletedProject = db.projects.splice(projectIndex, 1)[0];
      db.metadata.totalProjects = db.projects.length;
      db.metadata.lastUpdate = new Date().toISOString();

      await writeDatabase(db);
      console.log('🗑️ Project deleted:', deletedProject.id, deletedProject.name);
      res.json({ success: true, data: deletedProject });

    } else {
      res.status(405).json({ success: false, error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('❌ API Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}