import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from './auth.service.js';
import { User } from '../users/user.model.js';
import { AppError } from '../../utils/appError.js';
import * as jwt from '../../utils/jwt.js';

vi.mock('../users/user.model.js');
vi.mock('../../utils/jwt.js');

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('should throw an error if the email is already registered', async () => {
      // Arrange
      vi.mocked(User.findOne).mockResolvedValue({ id: 'existing' } as any);

      // Act & Assert
      await expect(
        AuthService.register({
          name: 'Test',
          email: 'test@example.com',
          password: 'password123',
        }),
      ).rejects.toThrowError(new AppError('Email already registered', 409, 'EMAIL_ALREADY_EXISTS'));
      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
    });

    it('should successfully register a new user and generate tokens', async () => {
      // Arrange
      vi.mocked(User.findOne).mockResolvedValue(null);
      const mockCreatedUser = {
        _id: 'mock-user-id',
        name: 'New User',
        email: 'new@example.com',
        role: 'customer',
        save: vi.fn(),
      };
      vi.mocked(User.create).mockResolvedValue(mockCreatedUser as any);
      vi.mocked(jwt.signAccessToken).mockReturnValue('mock-access-token');
      vi.mocked(jwt.signRefreshToken).mockReturnValue('mock-refresh-token');

      // Act
      const result = await AuthService.register({
        name: 'New User',
        email: 'new@example.com',
        password: 'password123',
      });

      // Assert
      expect(User.create).toHaveBeenCalledWith({
        name: 'New User',
        email: 'new@example.com',
        password: 'password123',
        role: 'customer',
        isActive: true,
      });
      expect(jwt.signAccessToken).toHaveBeenCalledWith({
        userId: 'mock-user-id',
        role: 'customer',
      });
      expect(jwt.signRefreshToken).toHaveBeenCalledWith({ userId: 'mock-user-id' });
      expect(result).toEqual({
        user: mockCreatedUser,
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      });
    });
  });

  describe('login', () => {
    it('should throw an error if the user is not found', async () => {
      // Arrange
      vi.mocked(User.findOne).mockReturnValue({
        select: vi.fn().mockResolvedValue(null),
      } as any);

      // Act & Assert
      await expect(
        AuthService.login({
          email: 'notfound@example.com',
          password: 'password123',
        }),
      ).rejects.toThrowError(new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS'));
    });

    it('should throw an error if password verification fails', async () => {
      // Arrange
      const mockUser = {
        _id: 'mock-user-id',
        comparePassword: vi.fn().mockResolvedValue(false),
      };
      vi.mocked(User.findOne).mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUser),
      } as any);

      // Act & Assert
      await expect(
        AuthService.login({
          email: 'found@example.com',
          password: 'wrongpassword',
        }),
      ).rejects.toThrowError(new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS'));
      expect(mockUser.comparePassword).toHaveBeenCalledWith('wrongpassword');
    });

    it('should successfully log in and generate tokens if credentials match', async () => {
      // Arrange
      const mockUser = {
        _id: 'mock-user-id',
        role: 'admin',
        comparePassword: vi.fn().mockResolvedValue(true),
      };
      vi.mocked(User.findOne).mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUser),
      } as any);
      vi.mocked(jwt.signAccessToken).mockReturnValue('mock-access-token');
      vi.mocked(jwt.signRefreshToken).mockReturnValue('mock-refresh-token');

      // Act
      const result = await AuthService.login({
        email: 'admin@example.com',
        password: 'password123',
      });

      // Assert
      expect(result).toEqual({
        user: mockUser,
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      });
    });
  });
});
