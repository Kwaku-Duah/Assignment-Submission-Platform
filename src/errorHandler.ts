import { NextFunction, Request, RequestHandler, Response } from 'express';
import { ErrorCode, HttpException } from './exceptions/rootException';
import { InternalException } from './exceptions/internalException';

type ExpressMiddleware = RequestHandler;

export const errorHandler = (method: ExpressMiddleware): ExpressMiddleware => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      method(req, res, next);
    } catch (error: unknown) {
      let exception: HttpException;
      if (error instanceof HttpException) {
        exception = error;
      } else {
        exception = new InternalException(
          'Something went wrong',
          error,
          ErrorCode.INTERNAL_EXCEPTION
        );
      }
      next(exception);
    }
  };
};
