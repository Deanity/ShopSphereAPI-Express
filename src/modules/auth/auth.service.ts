import crypto from 'crypto';
import { User, IUser } from '../users/user.model.js';
import { AppError } from '../../utils/appError.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt.js';

export interface AuthResponse {
  user: IUser;
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  static async register(data: {
    name: string;
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    // 1. Check email uniqueness before hashing/creating
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw new AppError('Email already registered', 409, 'EMAIL_ALREADY_EXISTS');
    }

    // 2. Create User (password hashing runs in pre-save middleware)
    const user = await User.create({
      name: data.name,
      email: data.email,
      password: data.password,
      role: 'customer',
      isActive: true,
    });

    // 3. Generate tokens
    const accessToken = signAccessToken({ userId: user._id.toString(), role: user.role });
    const refreshToken = signRefreshToken({ userId: user._id.toString() });

    // Remove password field from returning object
    user.password = undefined;

    return { user, accessToken, refreshToken };
  }

  static async login(data: { email: string; password: string }): Promise<AuthResponse> {
    // 1. Find user and explicitly select password
    const user = await User.findOne({ email: data.email, isActive: true }).select('+password');
    if (!user) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // 2. Compare password
    const isPasswordCorrect = await user.comparePassword(data.password);
    if (!isPasswordCorrect) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // 3. Generate tokens
    const accessToken = signAccessToken({ userId: user._id.toString(), role: user.role });
    const refreshToken = signRefreshToken({ userId: user._id.toString() });

    // Remove password field
    user.password = undefined;

    return { user, accessToken, refreshToken };
  }

  static async refreshToken(token: string): Promise<{ accessToken: string }> {
    // 1. Verify token (will throw JsonWebTokenError / TokenExpiredError if invalid)
    const decoded = verifyRefreshToken(token);

    // 2. Find user
    const user = await User.findOne({ _id: decoded.userId, isActive: true });
    if (!user) {
      throw new AppError('User not found or inactive', 401, 'INVALID_TOKEN');
    }

    // 3. Sign new access token
    const accessToken = signAccessToken({ userId: user._id.toString(), role: user.role });

    return { accessToken };
  }

  static async forgotPassword(email: string): Promise<{ resetToken: string; email: string }> {
    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Generate plain token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Store hashed token and expiry in DB
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour

    await user.save();

    return { resetToken, email: user.email };
  }

  static async resetPassword(token: string, password: string): Promise<void> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find active user with valid token that has not expired
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
      isActive: true,
    });

    if (!user) {
      throw new AppError('Reset token is invalid or has expired', 400, 'INVALID_RESET_TOKEN');
    }

    // Set new password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();
  }
}
