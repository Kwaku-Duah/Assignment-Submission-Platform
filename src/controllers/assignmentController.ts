import { NextFunction, Request, Response } from 'express';
import db from '../dbConfig/db';
import { ROLE } from '@prisma/client';

/**
 * Generates an assignment code based on the last assignment's ID.
 * @function
 * @async
 * @returns {Promise<string>} - The generated assignment code.
 */
const generateAssignmentCode = async (): Promise<string> => {
  const lastAssignment = await db.assignment.findFirst({
    orderBy: { id: 'desc' }
  });

  const lastAssignmentId = lastAssignment ? lastAssignment.id : 0;
  const newAssignmentId = lastAssignmentId + 1;

  return `ASS-${String(newAssignmentId).padStart(3, '0')}`;
};

/**
 * Creates a new assignment.
 * @function
 * @async
 * @param {AuthenticatedRequest} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} next - The Express next middleware function.
 * @returns {Promise<void>} - A Promise representing the completion of the operation.
 */

export interface User {
  id: number;
  staffId: string;
  role: ROLE;
}

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export const createAssignment = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { title, course, description, deadline, isPublished } = req.body;

    if (!title || !deadline) {
      throw new Error('Title and deadline are required.');
    }

    const assignmentCode = isPublished ? await generateAssignmentCode() : null;

    const assignment = await db.assignment.create({
      data: {
        title,
        course,
        description,
        deadline,
        isPublished,
        assignmentCode,
        lecturerId: req.user?.staffId as string
      }
    });

    res.status(201).json({ assignment });
  } catch (error: unknown) {
    next(error);
  }
};

/**
 * Get the total number of assignments.
 *
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next function.
 * @returns {Promise<void>} A Promise that resolves once the operation is complete.
 */

export const getTotalAssignments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const totalAssignments = await db.assignment.count();
    res.status(200).json({ totalAssignments });
  } catch (error: unknown) {
    next(error);
  }
};

/**
 * Update an assignment with the provided information.
 *
 * @param {AuthenticatedRequest} req - Express request object with user authentication information.
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next function.
 * @returns {Promise<void>} A Promise that resolves once the operation is complete.
 */

export const updateAssignment = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { assignmentCode, title, course, description, deadline, isPublished } = req.body;

    if (!assignmentCode || !title || !deadline) {
      throw new Error('AssignmentCode, title, and deadline are required.');
    }

    const existingAssignment = await db.assignment.findFirst({
      where: { assignmentCode, lecturerId: req.user?.staffId as string }
    });

    if (!existingAssignment) {
      res.status(404).json({ error: 'Assignment not found or not authorized.' });
      return;
    }
    const updatedAssignment = await db.assignment.update({
      where: { assignmentCode },
      data: {
        title,
        course,
        description,
        deadline,
        isPublished
      }
    });

    res.status(200).json({ assignment: updatedAssignment });
  } catch (error: unknown) {
    next(error);
  }
};

/**
 * Delete an assignment based on the provided assignment code.
 *
 * @param {AuthenticatedRequest} req - Express request object with user authentication information.
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next function.
 * @returns {Promise<void>} A Promise that resolves once the operation is complete.
 */

export const deleteAssignment = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { assignmentCode } = req.body;

    if (!assignmentCode) {
      throw new Error('AssignmentCode is required.');
    }

    const existingAssignment = await db.assignment.findFirst({
      where: { assignmentCode, lecturerId: req.user?.staffId as string }
    });

    if (!existingAssignment) {
      res.status(404).json({ error: 'Assignment not found or not authorized.' });
      return;
    }

    await db.assignment.delete({
      where: { assignmentCode }
    });

    res.status(200).json({ message: 'Assignment deleted successfully.' });
  } catch (error: unknown) {
    next(error);
  }
};

/**
 * Delete an assignment based on the provided assignment code.
 *
 * @param {AuthenticatedRequest} req - Express request object with user authentication information.
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next function.
 * @returns {Promise<void>} A Promise that resolves once the operation is complete.
 */

export const getAllAssignments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const assignments = await db.assignment.findMany();
    res.status(200).json({ assignments });
  } catch (error: unknown) {
    next(error);
  }
};
