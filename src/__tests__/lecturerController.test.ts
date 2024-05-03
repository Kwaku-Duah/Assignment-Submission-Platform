import { Request, Response } from 'express';
import { ROLE } from '@prisma/client';
import { addLecturer, getAllLecturers } from '../controllers/lecturerController';
import db from '../dbConfig/db';

jest.mock('../dbConfig/db', () => ({
  user: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn()
  },
  lecturer: {
    create: jest.fn()
  },
  assignment: {
    findMany: jest.fn()
  }
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword')
}));

jest.mock('../utils/passwordGenerator', () => ({
  generateTemporaryPassword: jest.fn().mockReturnValue('temporaryPassword')
}));

jest.mock('../services/lecturerMail', () => ({
  lecturerEmailInvitation: jest.fn()
}));

describe('Lecturer Controller Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addLecturer Function', () => {
    it('should add a new lecturer successfully', async () => {
      const mockRequest = {
        body: [{ firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com' }]
      } as Request;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as unknown as Response;

      (db.user.findFirst as jest.Mock).mockResolvedValueOnce(null);
      (db.user.create as jest.Mock).mockResolvedValueOnce({
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        staffId: 'LEC-00001'
      });
      (db.lecturer.create as jest.Mock).mockResolvedValueOnce({});

      await addLecturer(mockRequest, mockResponse, jest.fn());

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Lecturers processed',
        successfulEntries: [
          {
            email: 'john.doe@example.com',
            message: 'Lecturer created successfully'
          }
        ],
        skippedEntries: []
      });
    });

    it('should skip adding a lecturer if email already exists', async () => {
      const mockRequest = {
        body: [{ firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com' }]
      } as Request;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as unknown as Response;

      (db.user.findFirst as jest.Mock).mockResolvedValueOnce({
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        staffId: 'LEC-00001'
      });

      await addLecturer(mockRequest, mockResponse, jest.fn());

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Lecturers processed',
        successfulEntries: [],
        skippedEntries: [
          {
            email: 'john.doe@example.com',
            message: 'Email already exists'
          }
        ]
      });
    });
  });

  describe('getAllLecturers Function', () => {
    it('should get all lecturers successfully', async () => {
      const mockRequest = { query: { skip: '0' } } as unknown as Request;
      const mockResponse = {
        json: jest.fn()
      } as unknown as Response;

      (db.user.findMany as jest.Mock).mockResolvedValueOnce([
        {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          staffId: 'LEC-00001'
        }
      ]);

      await getAllLecturers(mockRequest, mockResponse);

      expect(db.user.findMany).toHaveBeenCalledWith({
        where: { role: ROLE.LECTURER },
        select: { id: true, firstName: true, lastName: true, email: true, staffId: true },
        skip: 0,
        take: 100
      });
      expect(mockResponse.json).toHaveBeenCalledWith({
        lecturers: [
          {
            id: 1,
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            staffId: 'LEC-00001'
          }
        ]
      });
    });
  });
});
