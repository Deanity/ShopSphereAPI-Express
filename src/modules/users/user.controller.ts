import { Request, Response, NextFunction } from 'express';
import { UserService } from './user.service.js';
import { formatResponse } from '../../utils/formatResponse.js';
import { AppError } from '../../utils/appError.js';

export class UserController {
  static async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401, 'INVALID_TOKEN');
      }

      const user = await UserService.getUserProfile(req.user.userId);
      res.status(200).json(formatResponse('User profile retrieved successfully', user));
    } catch (error) {
      next(error);
    }
  }

  static async updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401, 'INVALID_TOKEN');
      }

      const updatedUser = await UserService.updateUserProfile(req.user.userId, req.body);
      res.status(200).json(formatResponse('Profile updated successfully', updatedUser));
    } catch (error) {
      next(error);
    }
  }

  static async addAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401, 'INVALID_TOKEN');
      }

      const addresses = await UserService.addAddress(req.user.userId, req.body);
      res.status(201).json(formatResponse('Address added successfully', addresses));
    } catch (error) {
      next(error);
    }
  }

  static async updateAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401, 'INVALID_TOKEN');
      }

      const { id } = req.params;
      if (!id) {
        throw new AppError('Address ID is required', 400, 'ADDRESS_NOT_FOUND');
      }

      const addresses = await UserService.updateAddress(req.user.userId, id, req.body);
      res.status(200).json(formatResponse('Address updated successfully', addresses));
    } catch (error) {
      next(error);
    }
  }

  static async deleteAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401, 'INVALID_TOKEN');
      }

      const { id } = req.params;
      if (!id) {
        throw new AppError('Address ID is required', 400, 'ADDRESS_NOT_FOUND');
      }

      const addresses = await UserService.deleteAddress(req.user.userId, id);
      res.status(200).json(formatResponse('Address deleted successfully', addresses));
    } catch (error) {
      next(error);
    }
  }

  static async setDefaultAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401, 'INVALID_TOKEN');
      }

      const { id } = req.params;
      if (!id) {
        throw new AppError('Address ID is required', 400, 'ADDRESS_NOT_FOUND');
      }

      const addresses = await UserService.setDefaultAddress(req.user.userId, id);
      res.status(200).json(formatResponse('Default address set successfully', addresses));
    } catch (error) {
      next(error);
    }
  }
}
