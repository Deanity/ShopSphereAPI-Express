import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, AccessTokenPayload } from '../utils/jwt.js';
import { AppError } from '../utils/appError.js';

declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

export const requireAuth = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Access token is missing or invalid', 401, 'INVALID_TOKEN');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    req.user = decoded;
    next();
  } catch (error) {
    // If jwt.verify throws error, our global error middleware will automatically
    // map JsonWebTokenError -> INVALID_TOKEN and TokenExpiredError -> TOKEN_EXPIRED.
    next(error);
  }
};

export const restrictTo = (...roles: ('customer' | 'admin')[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('User authentication details are missing', 401, 'INVALID_TOKEN'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403, 'FORBIDDEN'),
      );
    }

    next();
  };
};
