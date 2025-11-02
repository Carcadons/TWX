import { NextApiRequest } from 'next';

export interface AuthenticatedUser {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

export function getCurrentUser(req: NextApiRequest): AuthenticatedUser | null {
  try {
    const user = (req as any).user;
    if (user && user.id) {
      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export function requireAuth(req: NextApiRequest): AuthenticatedUser {
  const user = getCurrentUser(req);
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}
