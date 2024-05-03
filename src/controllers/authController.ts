import { NextFunction, Request, Response } from 'express';
import db from '../dbConfig/db';
import { compare } from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../secrets';
import { BadRequestsException } from '../exceptions/badRequest';
import { ErrorCode } from '../exceptions/rootException';
import { NotFoundException } from '../exceptions/notFound';
import { expiration } from '../../constants';

/**
 * Handles user authentication based on provided credentials.
 *
 * @function
 * @async
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next function.
 * @returns {Promise<void>} - Promise that resolves after handling the authentication.
 * @throws {NotFoundException} - Throws an exception if the user is not found.
 * @throws {BadRequestsException} - Throws an exception if the password is incorrect.
 */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { emailOrId, password } = req.body;
    const user = await db.user.findFirst({
      where: {
        OR: [{ staffId: emailOrId }, { email: emailOrId }]
      }
    });

    if (!user) {
      throw new NotFoundException('User not found', ErrorCode.USER_NOT_FOUND);
    }

    const isPasswordValid: boolean = await compare(password, user.password);

    if (!isPasswordValid) {
      throw new BadRequestsException('Incorrect password', ErrorCode.INCORRECT_PASSWORD);
    }

    const changePassword = user.role === 'ADMIN' ? false : user.changePassword;
    const token: string = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: expiration
    });
    res.json({ user: { ...user, password: undefined, changePassword }, token });
  } catch (error) {
    next(error);
  }
};
