import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
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
      success: false,
      error: {
        message: err.message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
      },
    });
  }

  // Unknown errors
  console.error('Unexpected error:', err);
  
  // Check for database connection errors
  const errorMessage = err.message || 'Internal server error';
  const isDatabaseError = errorMessage.includes('P1001') || 
                         errorMessage.includes('Can\'t reach database') ||
                         errorMessage.includes('connect ECONNREFUSED');
  
  return res.status(500).json({
    success: false,
    error: {
      message: isDatabaseError 
        ? 'Database connection failed. Please ensure PostgreSQL is running and migrations are applied.'
        : 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { 
        stack: err.stack,
        originalError: errorMessage 
      }),
    },
  });
};

