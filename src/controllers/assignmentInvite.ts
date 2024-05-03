import { NextFunction, Request, Response } from 'express';
import { assignmentInviteEmail } from '../services/assignInvite';
import db from '../dbConfig/db';

/**
 * Controller function for sending assignment invitations to multiple students.
 *
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next function.
 * @returns {Promise<void>} A Promise that resolves with the result of the invitation process or an error.
 */

export const assignmentInviteController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { studentIds, assignmentCode } = req.body;

    const successfulEntries: unknown[] = [];
    const skippedEntries: unknown[] = [];

    for (const studentId of studentIds) {
      try {
        const user = await db.user.findUnique({
          where: { staffId: studentId }
        });

        if (!user) {
          skippedEntries.push({ studentId, message: 'User not found' });
          continue;
        }

        const assignment = await db.assignment.findUnique({
          where: { assignmentCode }
        });

        if (!assignment) {
          skippedEntries.push({ studentId, message: 'Assignment not found' });
          continue;
        }

        const { title, deadline } = assignment;
        const formattedDeadline: string = new Date(deadline).toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });

        await assignmentInviteEmail(user, user.email, title, formattedDeadline, assignmentCode);

        await db.invitation.create({
          data: {
            assignmentId: assignmentCode,
            students: {
              connect: { studentId: user.staffId }
            }
          }
        });

        successfulEntries.push({ studentId, message: 'Invitation sent successfully' });
      } catch (innerError) {
        skippedEntries.push({ studentId, message: 'Error processing invitation' });
      }
    }

    res.status(200).json({
      message: 'Invitations processed',
      successfulEntries,
      skippedEntries
    });
  } catch (error) {
    next(error);
  }
};
