// changePassword.test.ts

import { Request, Response } from 'express';
import { changePassword } from '../controllers/changePassword';
import db from '../dbConfig/db';
import bcrypt from 'bcrypt';

jest.mock('../dbConfig/db', () => ({
  user: {
    update: jest.fn()
  }
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValueOnce('hashedPassword')
}));

describe('changePassword Function', () => {
  let mockRequest: Request;
  let mockResponse: Response;

  beforeEach(() => {
    mockRequest = {
      body: {
        userId: '123',
        newPassword: 'newPassword123',
        confirmPassword: 'newPassword123'
      }
    } as Request;

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    } as unknown as Response;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should change user password successfully', async () => {
    await changePassword(mockRequest, mockResponse);

    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: '123' },
      data: {
        password: 'hashedPassword',
        changePassword: false
      }
    });

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.status(200).json).toHaveBeenCalledWith({
      message: 'Password changed successfully',
      success: true
    });
  });

  it('should handle mismatched passwords', async () => {
    mockRequest.body.confirmPassword = 'mismatchedPassword';

    await changePassword(mockRequest, mockResponse);

    expect(db.user.update).not.toHaveBeenCalled();

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.status(400).json).toHaveBeenCalledWith({
      message: 'New password and confirm password do not match'
    });
  });

  it('should handle missing parameters', async () => {
    mockRequest.body = {};

    await changePassword(mockRequest, mockResponse);

    expect(db.user.update).not.toHaveBeenCalled();

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.status(400).json).toHaveBeenCalledWith({
      message: 'userId, newPassword, and confirmPassword are required'
    });
  });

  it('should handle password length validation', async () => {
    mockRequest.body.newPassword = 'short';

    await changePassword(mockRequest, mockResponse);

    expect(db.user.update).not.toHaveBeenCalled();

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.status(400).json).toHaveBeenCalledWith({
      message: 'New password and confirm password do not match'
    });
  });

  it('should handle bcrypt hash error', async () => {
    (bcrypt.hash as jest.Mock).mockRejectedValueOnce(new Error('Hashing error'));

    await changePassword(mockRequest, mockResponse);

    expect(db.user.update).not.toHaveBeenCalled();

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.status(400).json).toHaveBeenCalledWith({
      message: 'Hashing error'
    });
  });
});
