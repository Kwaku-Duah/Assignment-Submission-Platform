import { Request, Response } from 'express';
import { uploadController } from '../controllers/uploadController';
import { uploadFileToS3 } from '../services/fileService';
import { createSubmission } from '../services/submissionService';

jest.mock('../services/fileService', () => ({
  uploadFileToS3: jest.fn()
}));

jest.mock('../services/submissionService', () => ({
  createSubmission: jest.fn()
}));

const mockRequest = (files: unknown[], body: { studentId: string; assignmentCode: string }) =>
  ({
    files,
    body
  }) as Request;

const mockResponse = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

describe('uploadController', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should upload files and create submissions', async () => {
    const files = [{ originalname: 'file1.txt' }, { originalname: 'file2.txt' }];
    const req = mockRequest(files, { studentId: 'student123', assignmentCode: 'assignment123' });
    const res = mockResponse();

    (uploadFileToS3 as jest.Mock).mockImplementation((file) =>
      Promise.resolve(`https://example.com/${file.originalname}`)
    );
    (createSubmission as jest.Mock).mockResolvedValueOnce({
      id: 1,
      fileUrl: 'https://example.com/file1.txt',
      studentId: 'student123',
      assignmentCode: 'assignment123'
    });
    (createSubmission as jest.Mock).mockResolvedValueOnce({
      id: 2,
      fileUrl: 'https://example.com/file2.txt',
      studentId: 'student123',
      assignmentCode: 'assignment123'
    });

    await uploadController(req, res);

    expect(uploadFileToS3).toHaveBeenCalledTimes(2);
    expect(createSubmission).toHaveBeenCalledTimes(2);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Upload successful',
      fileUrls: ['https://example.com/file1.txt', 'https://example.com/file2.txt'],
      submissions: [
        {
          id: 1,
          fileUrl: 'https://example.com/file1.txt',
          studentId: 'student123',
          assignmentCode: 'assignment123'
        },
        {
          id: 2,
          fileUrl: 'https://example.com/file2.txt',
          studentId: 'student123',
          assignmentCode: 'assignment123'
        }
      ]
    });
  });

  it('should handle missing files', async () => {
    const req = mockRequest([], { studentId: 'student123', assignmentCode: 'assignment123' });
    const res = mockResponse();

    await uploadController(req, res);

    expect(uploadFileToS3).not.toHaveBeenCalled();
    expect(createSubmission).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'No files provided for submission' });
  });

  it('should handle internal server error', async () => {
    const files = [{ originalname: 'file1.txt' }];
    const req = mockRequest(files, { studentId: 'student123', assignmentCode: 'assignment123' });
    const res = mockResponse();

    (uploadFileToS3 as jest.Mock).mockRejectedValueOnce(new Error('Upload failed'));

    await uploadController(req, res);

    expect(uploadFileToS3).toHaveBeenCalledTimes(1);
    expect(createSubmission).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });
});
