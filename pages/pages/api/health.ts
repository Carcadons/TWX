import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Fast health check - just return OK without any database calls
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString()
  });
}
