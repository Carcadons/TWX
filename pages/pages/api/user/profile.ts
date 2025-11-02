import type { NextApiRequest, NextApiResponse } from 'next';
import { getCurrentUser } from '../../../server/apiAuth';
import { db } from '../../../server/storage';
import { users } from '../../../shared/schema';
import { eq } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const currentUser = await getCurrentUser(req);
    
    if (!currentUser || !currentUser.id) {
      return res.status(401).json({ 
        success: false, 
        error: 'Unauthorized' 
      });
    }

    // GET - Retrieve current user profile
    if (req.method === 'GET') {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, currentUser.id))
        .limit(1);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          displayName: user.displayName,
          company: user.company,
          title: user.title,
          profileImageUrl: user.profileImageUrl
        }
      });
    }

    // PUT - Update user profile
    if (req.method === 'PUT') {
      const { displayName, company, title } = req.body;

      // Validate input
      if (displayName && typeof displayName !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Display name must be a string'
        });
      }

      if (company && typeof company !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Company must be a string'
        });
      }

      if (title && typeof title !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Title must be a string'
        });
      }

      // Update user profile
      const [updatedUser] = await db
        .update(users)
        .set({
          displayName: displayName || null,
          company: company || null,
          title: title || null,
          updatedAt: new Date()
        })
        .where(eq(users.id, currentUser.id))
        .returning();

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          displayName: updatedUser.displayName,
          company: updatedUser.company,
          title: updatedUser.title,
          profileImageUrl: updatedUser.profileImageUrl
        }
      });
    }

    // Method not allowed
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });

  } catch (error) {
    console.error('❌ Profile API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
