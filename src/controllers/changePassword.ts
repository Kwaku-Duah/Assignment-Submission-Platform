import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import db from '../dbConfig/db';

/**
 * Change the password for a user.
 *
 * @function
 * @async
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Promise that resolves after changing the password.
 */
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, newPassword, confirmPassword } = req.body;

    if (!userId || !newPassword || !confirmPassword) {
      throw new Error('userId, newPassword, and confirmPassword are required');
    }

    if (newPassword !== confirmPassword) {
      throw new Error('New password and confirm password do not match');
    }

    if (newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        changePassword: false
      }
    });

    res.status(200).json({ message: 'Password changed successfully', success: true });
  } catch (error: unknown) {
    const statusCode = (error as { status?: number }).status || 400;
    res.status(statusCode).json({ message: (error as Error).message || 'Bad Request' });
  }
};
