import { Router } from 'express';
import { errorHandler } from '../errorHandler';
import { changePassword, forgotReset } from '../controllers/forgotPasswordController';

const forgotRoute: Router = Router();
forgotRoute.post('/forgot', errorHandler(forgotReset));
forgotRoute.post('/reset', errorHandler(changePassword));
export default forgotRoute;
