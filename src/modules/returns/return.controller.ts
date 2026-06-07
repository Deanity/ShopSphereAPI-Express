import { Request, Response, NextFunction } from 'express';
import { ReturnService } from './return.service.js';
import { formatResponse } from '../../utils/formatResponse.js';
import { AppError } from '../../utils/appError.js';

export class ReturnController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Authentication required', 401, 'INVALID_TOKEN');
      }

      const returnRequest = await ReturnService.createReturnRequest(userId, req.body);
      res.status(201).json(formatResponse('Return request created successfully', returnRequest));
    } catch (error) {
      next(error);
    }
  }

  static async getMyReturns(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Authentication required', 401, 'INVALID_TOKEN');
      }

      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.max(1, parseInt(req.query.limit as string) || 10);

      const data = await ReturnService.getMyReturns(userId, { page, limit });
      res.status(200).json(formatResponse('Returns retrieved successfully', data.returns, data.meta));
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      const role = req.user?.role;
      if (!userId || !role) {
        throw new AppError('Authentication required', 401, 'INVALID_TOKEN');
      }

      const { id } = req.params;
      const returnRequest = await ReturnService.getReturnById(id, userId, role);
      res.status(200).json(formatResponse('Return request retrieved successfully', returnRequest));
    } catch (error) {
      next(error);
    }
  }

  static async getAllReturnsAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.max(1, parseInt(req.query.limit as string) || 10);
      const status = req.query.status as string | undefined;

      const data = await ReturnService.getAllReturnsAdmin({ page, limit, status });
      res.status(200).json(formatResponse('All returns retrieved successfully', data.returns, data.meta));
    } catch (error) {
      next(error);
    }
  }

  static async resolveReturnAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const returnRequest = await ReturnService.resolveReturnRequest(id, req.body);
      res.status(200).json(formatResponse('Return request resolved successfully', returnRequest));
    } catch (error) {
      next(error);
    }
  }
}
