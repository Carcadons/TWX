import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../server/db';
import { projects } from '../../shared/schema';
import { eq } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

      if (id && typeof id === 'string') {
        // Get specific project
        console.log('🔍 Looking for project with ID:', id);
        const project = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
        
        if (project.length > 0) {
          console.log('✅ Project found:', project[0].name);
          res.json({ 
            success: true, 
            data: {
              id: project[0].id,
              name: project[0].name,
              status: project[0].status,
              speckleUrl: project[0].speckleUrl,
              createdAt: project[0].createdAt.toISOString(),
              lastModified: project[0].lastModified.toISOString()
            }
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
        const allProjects = await db.select().from(projects);
        console.log('📋 Returning all projects:', allProjects.length);
        
        res.json({ 
          success: true, 
          data: allProjects.map(p => ({
            id: p.id,
            name: p.name,
            status: p.status,
            speckleUrl: p.speckleUrl,
            createdAt: p.createdAt.toISOString(),
            lastModified: p.lastModified.toISOString()
          })),
          metadata: {
            version: "1.0.0",
            lastUpdate: new Date().toISOString(),
            totalProjects: allProjects.length
          }
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

      const newProject = {
        id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: projectData.name,
        status: projectData.status || 'active',
        speckleUrl: projectData.speckleUrl || null,
        createdAt: new Date(),
        lastModified: new Date()
      };

      await db.insert(projects).values(newProject);
      
      console.log('✅ New project created:', newProject.id, newProject.name);
      res.json({ 
        success: true, 
        data: {
          id: newProject.id,
          name: newProject.name,
          status: newProject.status,
          speckleUrl: newProject.speckleUrl,
          createdAt: newProject.createdAt.toISOString(),
          lastModified: newProject.lastModified.toISOString()
        }
      });

    } else if (req.method === 'DELETE') {
      // Delete project
      const { id } = req.query;

      if (!id || typeof id !== 'string') {
        return res.status(400).json({ 
          success: false, 
          error: 'Project ID is required' 
        });
      }

      const project = await db.select().from(projects).where(eq(projects.id, id)).limit(1);

      if (project.length === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'Project not found' 
        });
      }

      await db.delete(projects).where(eq(projects.id, id));

      console.log('🗑️ Project deleted:', project[0].id, project[0].name);
      res.json({ 
        success: true, 
        data: {
          id: project[0].id,
          name: project[0].name,
          status: project[0].status,
          speckleUrl: project[0].speckleUrl,
          createdAt: project[0].createdAt.toISOString(),
          lastModified: project[0].lastModified.toISOString()
        }
      });

    } else {
      res.status(405).json({ success: false, error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('❌ API Error:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
}
