import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const changelogPath = path.join(process.cwd(), 'data', 'changelog.json');
    const changelogData = JSON.parse(fs.readFileSync(changelogPath, 'utf-8'));
    
    res.status(200).json({ 
      version: changelogData.metadata.currentVersion 
    });
  } catch (error) {
    console.error('Error reading version:', error);
    res.status(500).json({ version: 'unknown' });
  }
}
