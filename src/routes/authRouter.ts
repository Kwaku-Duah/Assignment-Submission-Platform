import { Router } from 'express';
import { login } from '../controllers/authController';
import { errorHandler } from '../errorHandler';

const authRoutes: Router = Router();
authRoutes.post('/login', errorHandler(login));
export default authRoutes;
