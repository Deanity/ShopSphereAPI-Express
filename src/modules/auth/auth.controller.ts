import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import { EmailService } from '../emails/email.service.js';
import { formatResponse } from '../../utils/formatResponse.js';
import { AppError } from '../../utils/appError.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { user, accessToken, refreshToken } = await AuthService.register(req.body);

      res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

      res.status(201).json(
        formatResponse('Registration successful', {
          user,
          accessToken,
        }),
      );
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { user, accessToken, refreshToken } = await AuthService.login(req.body);

      res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

      res.status(200).json(
        formatResponse('Login successful', {
          user,
          accessToken,
        }),
      );
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.cookies.refreshToken;
      if (!token) {
        throw new AppError('Refresh token is missing', 401, 'INVALID_TOKEN');
      }

      const { accessToken } = await AuthService.refreshToken(token);

      res.status(200).json(formatResponse('Token refreshed', { accessToken }));
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });

      res.status(200).json(formatResponse('Logout successful'));
    } catch (error) {
      next(error);
    }
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { resetToken, email } = await AuthService.forgotPassword(req.body.email);

      // Trigger email send (non-blocking)
      EmailService.sendPasswordResetEmail(email, resetToken).catch((err) =>
        console.error('❌ Failed to send password reset email:', err),
      );

      // Return token directly for now to allow integration / testing,
      // in production we would only send it via email.
      res.status(200).json(
        formatResponse('Password reset token generated successfully', {
          resetToken,
        }),
      );
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.params;
      const { password } = req.body;

      if (!token) {
        throw new AppError('Reset token is required', 400, 'INVALID_RESET_TOKEN');
      }

      await AuthService.resetPassword(token, password);

      res.status(200).json(formatResponse('Password reset successful'));
    } catch (error) {
      next(error);
    }
  }
}
