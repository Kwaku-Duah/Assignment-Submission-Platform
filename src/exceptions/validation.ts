import { HttpException } from './rootException';

export class UnprocessableEntity extends HttpException {
  constructor(error: unknown, message: string, errorCode: number) {
    super(message, errorCode, 422, error);
  }
}
