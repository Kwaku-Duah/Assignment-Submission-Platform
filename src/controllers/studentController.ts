import { NextFunction, Request, Response } from 'express';
import { ROLE } from '@prisma/client';
import { generateTemporaryPassword } from '../utils/passwordGenerator';
import { studentEmailInvitation } from '../services/studentMail';
import { hashPassword } from '../utils/hashPassword';
import { generateStudentID } from '../utils/idGenerateStudent';
import db from '../dbConfig/db';

export const addStudent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const studentsData: unknown[] = req.body;
    const successfulEntries: unknown[] = [];
    const skippedEntries: unknown[] = [];

    // Bulk upload functionality
    for (const student of studentsData) {
      const { firstName, lastName, email } = student as {
        firstName: string;
        lastName: string;
        email: string;
      };

      const existingUser = await db.user.findFirst({
        where: { email }
      });

      if (existingUser) {
        skippedEntries.push({ email, message: 'Email already exists' });
        continue;
      }

      const temporaryPassword = generateTemporaryPassword();
      const newStudentId = await generateStudentID();

      const newUser = await db.user.create({
        data: {
          firstName,
          lastName,
          email,
          password: temporaryPassword,
          staffId: newStudentId,
          role: ROLE.STUDENT,
          changePassword: true
        }
      });

      const hashedPassword = await hashPassword(temporaryPassword);

      await db.user.update({
        where: { id: newUser.id },
        data: {
          password: hashedPassword
        }
      });

      await db.student.create({
        data: {
          id: newUser.id,
          email: newUser.email,
          studentId: newStudentId
        }
      });

      await studentEmailInvitation(newUser, email, temporaryPassword);
      successfulEntries.push({
        email,
        message: 'Student created successfully'
      });
    }

    res.status(200).json({
      message: 'Users and Students processed',
      successfulEntries,
      skippedEntries
    });
  } catch (error: unknown) {
    next(error as Error);
  }
};

export const allStudents = async (req: Request, res: Response): Promise<void> => {
  try {
    const skip = parseInt(req.query.skip as string) || 0;
    const take = 100;

    const students = await db.user.findMany({
      where: {
        role: ROLE.STUDENT
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        staffId: true
      },
      skip,
      take
    });

    res.json({ students });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getTotalStudents = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const totalStudents = await db.user.count({
      where: { role: ROLE.STUDENT }
    });
    res.status(200).json({ totalStudents });
  } catch (error: unknown) {
    next(error);
  }
};

export const deleteStudent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const studentIdsToDelete: string[] = req.body.studentIds;
    const students = await db.student.findMany({
      where: { studentId: { in: studentIdsToDelete } }
    });

    if (students.length === 0) {
      res.status(404).json({ error: 'Students not found' });
      return;
    }
    const assignments = await db.invitation.findMany({
      where: { students: { some: { studentId: { in: studentIdsToDelete } } } }
    });

    if (assignments.length > 0) {
      await Promise.all(
        assignments.map(async (assignment) => {
          await db.invitation.deleteMany({
            where: { assignmentId: assignment.assignmentId }
          });
        })
      );
    }
    await db.student.deleteMany({
      where: { studentId: { in: studentIdsToDelete } }
    });
    await db.user.deleteMany({
      where: { staffId: { in: studentIdsToDelete } }
    });

    res.status(200).json({ message: 'Students deleted successfully' });
  } catch (error: unknown) {
    next(error as Error);
  }
};

export const editStudents = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { studentId, updatedUser } = req.body;
    await db.user.update({
      where: { staffId: studentId, role: ROLE.STUDENT },
      data: {
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName
      }
    });
    await db.student.update({
      where: { studentId },
      data: { email: updatedUser.email }
    });

    res.status(200).json({ message: 'Student details updated successfully' });
  } catch (error: unknown) {
    next(error as Error);
  }
};

interface CustomRequest extends Request {
  user?: {
    staffId?: string;
  };
}

/**
 * Fetch all assignments for a specific student.
 *
 * @param {CustomRequest} req - Express request object.
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next function.
 * @returns {Promise<void>} - A Promise that resolves when the operation is complete.
 *
 * @throws {Error} If an unexpected error occurs.
 */

export const getStudentAssignments = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const studentId = req.user?.staffId;

    if (!studentId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const assignments = await db.invitation.findMany({
      where: {
        students: {
          some: {
            studentId: studentId
          }
        }
      },
      include: {
        Assignment: true
      }
    });

    const assignmentDetails = assignments.map(
      (invitation: { Assignment: unknown }) => invitation.Assignment
    );

    res.status(200).json({ assignments: assignmentDetails });
  } catch (error: unknown) {
    next(error as Error);
  }
};
