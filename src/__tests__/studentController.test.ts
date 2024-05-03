import { Request, Response } from 'express';
import { ROLE } from '@prisma/client';
import db from '../dbConfig/db';
import { addStudent, allStudents, getTotalStudents } from '../controllers/studentController';
import { studentEmailInvitation } from '../services/studentMail';

jest.mock('../dbConfig/db', () => ({
  user: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn()
  },
  student: {
    create: jest.fn()
  }
}));

jest.mock('../utils/passwordGenerator', () => ({
  generateTemporaryPassword: jest.fn().mockReturnValueOnce('temporaryPassword')
}));

jest.mock('../services/studentMail', () => ({
  studentEmailInvitation: jest.fn()
}));

jest.mock('../utils/hashPassword', () => ({
  hashPassword: jest.fn().mockResolvedValueOnce('hashedPassword')
}));

jest.mock('../utils/idGenerateStudent', () => ({
  generateStudentID: jest.fn().mockReturnValueOnce('STU-00001')
}));
jest.mock('../utils/mailer', () => ({
  transporter: {
    sendMail: jest.fn().mockResolvedValueOnce({})
  }
}));

describe('Student Controller Tests', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('addStudent Function', () => {
    it('should add a new student successfully', async () => {
      const mockRequest = {
        body: [{ firstName: 'Alice', lastName: 'Doe', email: 'alice.doe@example.com' }]
      } as Request;
      (db.user.findFirst as jest.Mock).mockResolvedValueOnce(null).mockResolvedValueOnce({
        id: 1,
        firstName: 'Alice',
        lastName: 'Doe',
        email: 'alice.doe@example.com',
        staffId: 'STU-00001'
      });

      (db.user.create as jest.Mock).mockResolvedValueOnce({
        id: 1,
        firstName: 'Alice',
        lastName: 'Doe',
        email: 'alice.doe@example.com',
        staffId: 'STU-00001'
      });

      (db.student.create as jest.Mock).mockResolvedValueOnce({}); // First call

      const mockStudentEmailInvitation = jest.fn();
      (studentEmailInvitation as jest.Mock).mockImplementationOnce(mockStudentEmailInvitation); // First call
      const mockResponse: Response = {
        status: jest.fn().mockReturnValueOnce({ json: jest.fn() }), // First call
        json: jest.fn()
      } as unknown as Response;

      await addStudent(mockRequest, mockResponse, jest.fn());
    });

    it('should skip adding a student if email already exists', async () => {
      const mockRequest = {
        body: [{ firstName: 'Alice', lastName: 'Doe', email: 'alice.doe@example.com' }]
      } as Request;
      (db.user.findFirst as jest.Mock).mockResolvedValueOnce({
        id: 1,
        firstName: 'Alice',
        lastName: 'Doe',
        email: 'alice.doe@example.com',
        staffId: 'STU-00001'
      });

      const mockResponse: Response = {
        status: jest.fn().mockReturnValueOnce({ json: jest.fn() }),
        json: jest.fn()
      } as unknown as Response;

      await addStudent(mockRequest, mockResponse, jest.fn());
    });
  });

  describe('allStudents Function', () => {
    it('should get all students successfully', async () => {
      const mockRequest = { query: { skip: '0' } } as unknown as Request;
      (db.user.findMany as jest.Mock).mockResolvedValueOnce([
        {
          firstName: 'Alice',
          lastName: 'Doe',
          email: 'alice.doe@example.com',
          staffId: 'STU-00001'
        }
      ]);
      const mockResponse: Response = {
        json: jest.fn()
      } as unknown as Response;

      await allStudents(mockRequest, mockResponse);

      expect(db.user.findMany).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith({
        students: [
          {
            firstName: 'Alice',
            lastName: 'Doe',
            email: 'alice.doe@example.com',
            staffId: 'STU-00001'
          }
        ]
      });
    });
  });

  describe('getTotalStudents Function', () => {
    it('should get the total number of students successfully', async () => {
      const mockResponse: Response = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as unknown as Response;
      (db.user.count as jest.Mock).mockResolvedValue(5);
      await getTotalStudents(jest.fn() as unknown as Request, mockResponse, jest.fn());
      expect(db.user.count).toHaveBeenCalledWith({ where: { role: ROLE.STUDENT } });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.status(200).json).toHaveBeenCalledWith({ totalStudents: 5 });
    });
  });
});
