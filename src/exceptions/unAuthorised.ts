import { HttpException } from './rootException';

export class UnauthorizedException extends HttpException {
  constructor(message: string, errorCode: number, errors?: unknown) {
    super(message, errorCode, 401, errors);
  }
}
