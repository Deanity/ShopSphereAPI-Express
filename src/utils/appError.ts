import { ZodIssue } from 'zod';

export class AppError extends Error {
  constructor(
    public override message: string,
    public statusCode: number,
    public code: string,
    public errors?: ZodIssue[],
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}
