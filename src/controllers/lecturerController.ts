import { NextFunction, Request, Response } from 'express';
import { ROLE } from '@prisma/client';
import { generateTemporaryPassword } from '../utils/passwordGenerator';
import bcrypt from 'bcrypt';
import { lecturerEmailInvitation } from '../services/lecturerMail';
import db from '../dbConfig/db';

const generateLecturerID = async (): Promise<string> => {
  const lastLecturer = await db.user.findFirst({
    where: { role: ROLE.LECTURER },
    orderBy: { staffId: 'desc' }
  });

  const lastUserId = lastLecturer ? parseInt(lastLecturer.staffId.split('-')[1]) : 0;
  const newLecturerId = `LEC-${String(lastUserId + 1).padStart(5, '0')}`;

  return newLecturerId;
};

const hashPassword = async (password: string): Promise<string> => {
  const hashedPassword = await bcrypt.hash(password, 10);
  return hashedPassword;
};

/**
 * Handles the addition of lecturers based on the provided data.
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next function.
 * @returns {Promise<void>} - Promise that resolves after handling the addition of lecturers.
 */

export const addLecturer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const lecturersData: unknown[] = req.body;
    const successfulEntries: unknown[] = [];
    const skippedEntries: unknown[] = [];

    for (const lecturer of lecturersData) {
      const { firstName, lastName, email } = lecturer as {
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
      const newLecturerId = await generateLecturerID();

      const newUser = await db.user.create({
        data: {
          firstName,
          lastName,
          email,
          password: temporaryPassword,
          staffId: newLecturerId,
          role: ROLE.LECTURER,
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

      await db.lecturer.create({
        data: {
          id: newUser.id,
          email: newUser.email,
          lecturerId: newLecturerId
        }
      });

      await lecturerEmailInvitation(newUser, email, temporaryPassword);

      successfulEntries.push({ email, message: 'Lecturer created successfully' });
    }

    res.status(200).json({
      message: 'Lecturers processed',
      successfulEntries,
      skippedEntries
    });
  } catch (error: unknown) {
    next(error as Error);
  }
};

/**
 * Fetches a list of lecturers with optional pagination parameters.
 *
 * @function
 * @async
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Promise that resolves after handling the request.
 */

export const getAllLecturers = async (req: Request, res: Response): Promise<void> => {
  try {
    const skip = parseInt(req.query.skip as string) || 0;
    const take = 100;

    const lecturers = await db.user.findMany({
      where: {
        role: ROLE.LECTURER
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

    res.json({ lecturers });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Retrieves the total count of lecturers in the database.
 *
 * @function
 * @async
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next function.
 * @returns {Promise<void>} - Promise that resolves after handling the request.
 */

export const getTotalLecturers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const totalLecturers = await db.user.count({ where: { role: ROLE.LECTURER } });
    res.status(200).json({ totalLecturers });
  } catch (error: unknown) {
    next(error);
  }
};

/**
 * Deletes one or more lecturers and their associated assignments from the database.
 *
 * @function
 * @async
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next function.
 * @returns {Promise<void>} - Promise that resolves after handling the request.
 * @throws {Error} - Throws an error if there is a problem during the deletion process.
 */

export const deleteLecturer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const staffIdsToDelete: string[] = req.body.staffIds;
    const lecturers = await db.user.findMany({
      where: { staffId: { in: staffIdsToDelete }, role: ROLE.LECTURER }
    });
    if (lecturers.length === 0) {
      res.status(404).json({ error: 'Lecturers not found' });
      return;
    }

    // Check if the lecturers have any assignments
    const assignments = await db.assignment.findMany({
      where: { lecturerId: { in: lecturers.map((lecturer) => lecturer.staffId) } }
    });
    if (assignments.length > 0) {
      await Promise.all(
        assignments.map(async (assignment) => {
          await db.invitation.deleteMany({
            where: { assignmentId: assignment.assignmentCode }
          });
          await db.assignment.delete({
            where: { id: assignment.id }
          });
        })
      );
    }
    await db.lecturer.deleteMany({
      where: { lecturerId: { in: lecturers.map((lecturer) => lecturer.staffId) } }
    });
    await db.user.deleteMany({
      where: { staffId: { in: lecturers.map((lecturer) => lecturer.staffId) } }
    });
    res.status(200).json({ message: 'Lecturers deleted successfully' });
  } catch (error: unknown) {
    next(error as Error);
  }
};

/**
 * Updates the details of a lecturer in the database.
 *
 * @function
 * @async
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Promise that resolves after updating the lecturer details.
 */

export const editLecturer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { staffId, updatedUser } = req.body;
    await db.user.update({
      where: { staffId },
      data: {
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName
      }
    });
    await db.lecturer.update({
      where: { lecturerId: staffId },
      data: { email: updatedUser.email }
    });

    res.status(200).json({ message: 'Lecturer details updated successfully' });
  } catch (error: unknown) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

interface CustomRequest extends Request {
  user?: {
    staffId: string;
    role: ROLE;
  };
}

/**
 * Retrieves assignments associated with the authenticated lecturer, along with total submissions and student names.
 * @function
 * @async
 * @param {CustomRequest} req - Express authenticated request object containing lecturer information.
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next function.
 * @returns {Promise<void>} - Promise that resolves after retrieving and formatting lecturer assignments.
 */

export const getLecturerAssignments = async (
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

    // Fetch assignments along with total submissions and student names
    const assignments = await db.assignment.findMany({
      where: { lecturerId },
      include: {
        submission: {
          select: {
            studentId: true
          }
        }
      }
    });
    const formattedAssignments = await Promise.all(
      assignments.map(async (assignment) => {
        const uniqueSubmissions = Array.from(
          new Set(assignment.submission.map((sub) => sub.studentId))
        );

        const totalSubmissions = uniqueSubmissions.length;
        const uniqueStudentIds = new Set<string>();
        const uniqueStudentNames = new Set<string>();

        await Promise.all(
          uniqueSubmissions.map(async (studentId) => {
            uniqueStudentIds.add(studentId!);
            const student = await db.user.findUnique({
              where: {
                staffId: studentId || ''
              }
            });
            if (student) {
              uniqueStudentNames.add(`${student.firstName} ${student.lastName}`);
            }
          })
        );
        const uniqueSubmissionObjects = Array.from(
          new Set(assignment.submission.map((sub) => JSON.stringify(sub)))
        );
        const uniqueSubmissionsArray = uniqueSubmissionObjects.map((sub) => JSON.parse(sub));

        return {
          ...assignment,
          totalSubmissions,
          submission: uniqueSubmissionsArray,
          studentIds: Array.from(uniqueStudentIds),
          studentNames: Array.from(uniqueStudentNames)
        };
      })
    );

    res.json({ assignments: formattedAssignments });
  } catch (error: unknown) {
    next(error);
  }
};
