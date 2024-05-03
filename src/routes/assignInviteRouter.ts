import express from 'express';
import { errorHandler } from '../errorHandler';
import { assignmentInviteController } from '../controllers/assignmentInvite';

const assignInviteRouter = express.Router();
assignInviteRouter.post('/assignment', errorHandler(assignmentInviteController));

export default assignInviteRouter;
