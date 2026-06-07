import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireAuth, restrictTo } from './authMiddleware.js';
import { AppError } from '../utils/appError.js';
import * as jwt from '../utils/jwt.js';

vi.mock('../utils/jwt.js');

describe('Auth Middleware', () => {
  let mockRequest: any;
  let mockResponse: any;
  let nextFunction: any;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {};
    nextFunction = vi.fn();
    vi.clearAllMocks();
  });

  describe('requireAuth', () => {
    it('should throw an error if authorization header is missing', () => {
      // Arrange
      mockRequest.headers = {};

      // Act
      requireAuth(mockRequest, mockResponse, nextFunction);

      // Assert
      expect(nextFunction).toHaveBeenCalledWith(
        new AppError('Access token is missing or invalid', 401, 'INVALID_TOKEN'),
      );
    });

    it('should throw an error if authorization header does not start with Bearer', () => {
      // Arrange
      mockRequest.headers = { authorization: 'Basic dXNlcjpwYXNz' };

      // Act
      requireAuth(mockRequest, mockResponse, nextFunction);

      // Assert
      expect(nextFunction).toHaveBeenCalledWith(
        new AppError('Access token is missing or invalid', 401, 'INVALID_TOKEN'),
      );
    });

    it('should set req.user and call next if token is valid', () => {
      // Arrange
      mockRequest.headers = { authorization: 'Bearer valid-token' };
      const mockPayload = { userId: '123', role: 'customer' as const };
      vi.mocked(jwt.verifyAccessToken).mockReturnValue(mockPayload);

      // Act
      requireAuth(mockRequest, mockResponse, nextFunction);

      // Assert
      expect(jwt.verifyAccessToken).toHaveBeenCalledWith('valid-token');
      expect(mockRequest.user).toEqual(mockPayload);
      expect(nextFunction).toHaveBeenCalledWith();
      expect(nextFunction).not.toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('restrictTo', () => {
    it('should throw an error if req.user is missing', () => {
      // Arrange
      mockRequest.user = undefined;

      // Act
      const middleware = restrictTo('admin');
      middleware(mockRequest, mockResponse, nextFunction);

      // Assert
      expect(nextFunction).toHaveBeenCalledWith(
        new AppError('User authentication details are missing', 401, 'INVALID_TOKEN'),
      );
    });

    it('should throw an error if user role is not authorized', () => {
      // Arrange
      mockRequest.user = { userId: '123', role: 'customer' };

      // Act
      const middleware = restrictTo('admin');
      middleware(mockRequest, mockResponse, nextFunction);

      // Assert
      expect(nextFunction).toHaveBeenCalledWith(
        new AppError('You do not have permission to perform this action', 403, 'FORBIDDEN'),
      );
    });

    it('should call next if user role is authorized', () => {
      // Arrange
      mockRequest.user = { userId: '123', role: 'admin' };

      // Act
      const middleware = restrictTo('admin');
      middleware(mockRequest, mockResponse, nextFunction);

      // Assert
      expect(nextFunction).toHaveBeenCalledWith();
    });
  });
});
