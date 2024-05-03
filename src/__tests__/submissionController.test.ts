// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { NextFunction, Request, Response } from 'express';
import { countSubmissions, submissionController } from '../controllers/submissionController';
import db from '../dbConfig/db';

jest.mock('../dbConfig/db', () => ({
  submissions: {
    findMany: jest.fn(),
    groupBy: jest.fn()
  }
}));

const mockRequest = (params?: unknown, user?: unknown) => {
  return { params, user } as unknown as Request;
};

const mockResponse = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

describe('submissionController', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return submissions', async () => {
    const req = mockRequest({ studentId: 'student1', assignmentCode: 'assignment123' });
    const res = mockResponse();
    const submissions = [
      {
        id: 1,
        studentId: 'student1',
        assignmentCode: 'assignment123',
        content: 'Submission content'
      }
    ];
    (db.submissions.findMany as jest.Mock).mockResolvedValueOnce(submissions);

    await submissionController(req, res);

    expect(db.submissions.findMany).toHaveBeenCalledWith({
      where: { studentId: 'student1', assignmentCode: 'assignment123' }
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ submissions });
  });

  it('should handle internal server error', async () => {
    const req = mockRequest({ studentId: 'student1', assignmentCode: 'assignment123' });
    const res = mockResponse();
    (db.submissions.findMany as jest.Mock).mockRejectedValueOnce(
      new Error('Internal server error')
    );

    await submissionController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });
});

describe('countSubmissions', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return submission counts', async () => {
    const req = mockRequest(undefined, { staffId: 'lecturer123' });
    const res = mockResponse();
    const submissionCounts = [{ assignmentCode: 'assignment123', _count: { _all: 3 } }];
    (db.submissions.groupBy as jest.Mock).mockResolvedValueOnce(submissionCounts);

    await countSubmissions(req, res, jest.fn());

    expect(db.submissions.groupBy).toHaveBeenCalledWith({
      by: ['assignmentCode'],
      _count: {
        _all: true
      },
      where: {
        Assignment: {
          lecturerId: 'lecturer123'
        }
      }
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ submissionCounts });
  });

  it('should handle unauthorized access', async () => {
    const req = mockRequest();
    const res = mockResponse();

    await countSubmissions(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });
});

describe('submissionController', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should handle missing studentId', async () => {
    const req = mockRequest({ assignmentCode: 'assignment123' }); // No studentId provided
    const res = mockResponse();

    await submissionController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Student ID and Assignment Code are required.'
    });
  });

  it('should handle missing assignmentCode', async () => {
    const req = mockRequest({ studentId: 'student123' }); // No assignmentCode provided
    const res = mockResponse();

    await submissionController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Student ID and Assignment Code are required.'
    });
  });

  it('should handle internal server error', async () => {
    const req = mockRequest({ studentId: 'student1', assignmentCode: 'assignment123' });
    const res = mockResponse();
    (db.submissions.findMany as jest.Mock).mockRejectedValueOnce(
      new Error('Internal server error')
    );

    await submissionController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });
});
