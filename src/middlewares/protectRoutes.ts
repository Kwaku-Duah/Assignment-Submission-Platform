import { NextFunction, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../secrets';

export const checkTokenExpiration = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.headers.authorization;

  if (!token) {
    return next();
  }

  jwt.verify(token, JWT_SECRET, (error) => {
    if (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Session expired. Please log in again.' });
      } else {
        return res.status(403).json({ message: 'Invalid token' });
      }
    }

    next();
  });
};
// fix
