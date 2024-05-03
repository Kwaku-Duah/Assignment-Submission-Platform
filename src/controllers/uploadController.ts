import { Request, Response } from 'express';
import { uploadFileToS3 } from '../services/fileService';
import { createSubmission } from '../services/submissionService';

/**
 * Handles the file upload and creates submissions for each uploaded file.
 *
 * @param {Request} req - Express Request object.
 * @param {Response} res - Express Response object.
 * @returns {Promise<void>} A Promise that resolves once the processing is complete.
 */

export const uploadController = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if req.files is defined and is an array
    if (Array.isArray(req.files) && req.files.length > 0) {
      const fileUrls = await Promise.all(
        req.files.map(async (file) => {
          return uploadFileToS3(file);
        })
      );
      const { studentId, assignmentCode } = req.body;
      const submissions = await Promise.all(
        fileUrls.map(async (fileUrl) => {
          return createSubmission(fileUrl, studentId, assignmentCode);
        })
      );

      res.status(200).json({ message: 'Upload successful', fileUrls, submissions });
    } else {
      res.status(400).json({ error: 'No files provided for submission' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
