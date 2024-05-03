import express from 'express';
import { Router } from 'express';
import { uploadController } from '../controllers/uploadController';
import { uploadMiddleware, uploadToS3Middleware } from '../middlewares/uploadMiddleware';

const uploadRoute: Router = express.Router();

uploadRoute.post('/assignment', uploadMiddleware, uploadToS3Middleware, uploadController);

export default uploadRoute;
