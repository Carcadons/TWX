export default function handler(req, res) {
  console.log('📡 /api/stats called');

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  res.status(200).json({
    success: true,
    data: {
      totalInspections: 0,
      totalProjects: 0,
      server: 'online'
    }
  });
}