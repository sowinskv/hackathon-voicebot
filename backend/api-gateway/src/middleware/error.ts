import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
  }

  // Log unexpected errors
  console.error('ERROR:', err);

  // Database errors
  if (err.message.includes('duplicate key')) {
    return res.status(409).json({
      status: 'error',
      message: 'Resource already exists',
    });
  }

  if (err.message.includes('foreign key constraint')) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid reference to related resource',
    });
  }

  if (err.message.includes('violates not-null constraint')) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing required field',
    });
  }

  // Default error
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
  });
};

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const err = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(err);
};
