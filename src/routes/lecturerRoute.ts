import { Router } from 'express';
import { errorHandler } from '../errorHandler';
import { adminMiddleware, authMiddleware, lecturerMiddleware } from '../middlewares/authMiddleware';
import {
  addLecturer,
  deleteLecturer,
  editLecturer,
  getAllLecturers,
  getLecturerAssignments,
  getTotalLecturers
} from '../controllers/lecturerController';

const lecturerRoutes: Router = Router();
lecturerRoutes.post('/register', [authMiddleware, adminMiddleware], errorHandler(addLecturer));
// specific to the lecturer
lecturerRoutes.get(
  '/assignments',
  authMiddleware,
  lecturerMiddleware,
  errorHandler(getLecturerAssignments)
);
// admin user to see
lecturerRoutes.get('/all', getAllLecturers);
lecturerRoutes.get('/total', getTotalLecturers);
lecturerRoutes.delete('/clear', deleteLecturer);
lecturerRoutes.put('/update', editLecturer);
export default lecturerRoutes;
