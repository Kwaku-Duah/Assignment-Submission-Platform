import { Router } from 'express';
import {
  addStudent,
  allStudents,
  deleteStudent,
  editStudents,
  getStudentAssignments,
  getTotalStudents
} from '../controllers/studentController';
import { adminMiddleware, authMiddleware, studentMiddleware } from '../middlewares/authMiddleware';
import { errorHandler } from '../errorHandler';

const studentRoutes: Router = Router();
studentRoutes.post('/register', [authMiddleware, adminMiddleware], errorHandler(addStudent));
// Admin to see
studentRoutes.get('/all', errorHandler(allStudents));
// specific to signed in student
studentRoutes.get('/byassignment', [authMiddleware, studentMiddleware], getStudentAssignments);
studentRoutes.get('/total', errorHandler(getTotalStudents));
studentRoutes.delete('/clear', deleteStudent);
studentRoutes.put('/update', editStudents);

export default studentRoutes;
