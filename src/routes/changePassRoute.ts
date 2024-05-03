import { Router } from 'express';
import { errorHandler } from '../errorHandler';
import { changePassword } from '../controllers/changePassword';

const changePassRoutes: Router = Router();
changePassRoutes.post('/reset', errorHandler(changePassword));
export default changePassRoutes;
