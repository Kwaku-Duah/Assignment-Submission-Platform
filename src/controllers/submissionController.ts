import { NextFunction, Request, Response } from 'express';
import db from '../dbConfig/db';

/**
 * Handles requests for retrieving submissions based on student ID and assignment code.
 *
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Promise representing the asynchronous operation.
 */

export const submissionController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId, assignmentCode } = req.params;

    if (!studentId || !assignmentCode) {
      res.status(400).json({ error: 'Student ID and Assignment Code are required.' });
      return;
    }

    const submissions = await db.submissions.findMany({
      where: {
        studentId,
        assignmentCode
      }
    });

    res.status(200).json({ submissions });
  } catch (error: unknown) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Counts the number of submissions for each assignment associated with the authenticated lecturer.
 * @param {CustomRequest} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next function.
 * @returns {Promise<void>}
 */

interface CustomRequest extends Request {
  user?: {
    staffId?: string;
  };
}

export const countSubmissions = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const lecturerId = req.user?.staffId;

    if (!lecturerId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const submissionCounts = await db.submissions.groupBy({
      by: ['assignmentCode'],
      _count: {
        _all: true
      },
      where: {
        Assignment: {
          lecturerId: lecturerId
        }
      }
    });
    res.status(200).json({ submissionCounts });
  } catch (error: unknown) {
    next(error as Error);
  }
};

/**
 * Counts the number of distinct assignments that have been submitted.
 * @param {CustomRequest} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next function.
 * @returns {Promise<void>}
 */

export const countSubmittedAssignments = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const distinctAssignments = await db.submissions.findMany({
      distinct: ['assignmentCode'],
      select: {
        assignmentCode: true
      }
    });

    const assignmentCount = distinctAssignments.length;

    res.status(200).json({ assignmentCount });
  } catch (error: unknown) {
    next(error as Error);
  }
};
