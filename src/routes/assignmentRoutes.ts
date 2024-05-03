import express from 'express';
import { errorHandler } from '../errorHandler';
import { authMiddleware, lecturerMiddleware } from '../middlewares/authMiddleware';
import {
  createAssignment,
  deleteAssignment,
  getAllAssignments,
  getTotalAssignments,
  updateAssignment
} from '../controllers/assignmentController';

const assignmentRouter = express.Router();

assignmentRouter.post('/new', authMiddleware, lecturerMiddleware, errorHandler(createAssignment));
assignmentRouter.get('/all', getAllAssignments);
assignmentRouter.get('/total', getTotalAssignments);
assignmentRouter.put('/update', updateAssignment);
assignmentRouter.delete('/clear', deleteAssignment);
export default assignmentRouter;
