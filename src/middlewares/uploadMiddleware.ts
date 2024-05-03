// middlewares/uploadMiddleware.ts
import multer, { Multer } from 'multer';
import { RequestHandler } from 'express';
import { uploadToS3 } from '../services/fileService';
import { NextFunction, Request, Response } from 'express';

const upload: Multer = multer({
  storage: multer.memoryStorage()
});

export const uploadMiddleware: RequestHandler = upload.array('files');

export const uploadToS3Middleware: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.files && Array.isArray(req.files)) {
      await uploadToS3(req.files);
      next();
    } else {
      res.status(400).json({ error: 'No files provided for submission' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
