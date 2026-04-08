import { Request, Response, NextFunction } from 'express';

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('[ERROR]', err.message, err.stack);

  res.status(500).json({
    success: false,
    error: 'Wystąpił błąd serwera',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
};
