import { compare } from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { login } from '../controllers/authController';
import { NextFunction, Request, Response } from 'express';
import { NotFoundException } from '../exceptions/notFound';
import { BadRequestsException } from '../exceptions/badRequest';
import db from '../dbConfig/db';

jest.mock('bcrypt', () => ({
  compare: jest.fn()
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn()
}));

jest.mock('../dbConfig/db', () => ({
  user: {
    findFirst: jest.fn()
  }
}));

describe('Login Controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    req = {
      body: { emailOrId: 'admin@example.com', password: 'paSS><123' }
    };
    res = {
      json: jest.fn()
    };
    next = jest.fn();
  });

  it('should login a user successfully', async () => {
    const mockUser = {
      id: 1,
      staffId: 'user123',
      email: 'admin@example.com',
      password: 'hashedPassword',
      role: 'USER',
      changePassword: true
    };

    (db.user.findFirst as jest.Mock).mockResolvedValueOnce(mockUser);
    (compare as jest.Mock).mockResolvedValueOnce(true);
    (jwt.sign as jest.Mock).mockReturnValueOnce('fakeToken');

    await login(req as Request, res as Response, next as NextFunction);

    expect(res.json).toHaveBeenCalledWith({
      user: { ...mockUser, password: undefined, changePassword: true },
      token: 'fakeToken'
    });
  });

  it('should handle user not found', async () => {
    (db.user.findFirst as jest.Mock).mockResolvedValueOnce(null);

    await login(req as Request, res as Response, next as NextFunction);

    expect(next).toHaveBeenCalledWith(expect.any(NotFoundException));
  });

  it('should handle incorrect password', async () => {
    const mockUser = {
      id: 1,
      staffId: 'user123',
      email: 'admin@example.com',
      password: 'hashedPassword',
      role: 'USER',
      changePassword: true
    };

    (db.user.findFirst as jest.Mock).mockResolvedValueOnce(mockUser);
    (compare as jest.Mock).mockResolvedValueOnce(false);

    await login(req as Request, res as Response, next as NextFunction);

    expect(next).toHaveBeenCalledWith(expect.any(BadRequestsException));
  });

  it('should handle unexpected errors', async () => {
    const mockError = new Error('Unexpected error');

    (db.user.findFirst as jest.Mock).mockRejectedValueOnce(mockError);

    await login(req as Request, res as Response, next as NextFunction);

    expect(next).toHaveBeenCalledWith(mockError);
  });
});
