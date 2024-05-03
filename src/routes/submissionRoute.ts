import express from 'express';
import { Router } from 'express';
import { submissionController } from '../controllers/submissionController';
import { adminMiddleware, authMiddleware, lecturerMiddleware } from '../middlewares/authMiddleware';
import { countSubmissions } from '../controllers/submissionController';
import { countSubmittedAssignments } from '../controllers/submissionController';

export const submissionRoute: Router = express.Router();

submissionRoute.get('/:studentId/:assignmentCode', submissionController);
submissionRoute.get('/assignments', authMiddleware, lecturerMiddleware, countSubmissions);
submissionRoute.get('/total', authMiddleware, adminMiddleware, countSubmittedAssignments);

export default submissionRoute;
