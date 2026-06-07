import { Request, Response, NextFunction } from 'express';
import { StockService } from './stock.service.js';
import { formatResponse } from '../../utils/formatResponse.js';
import { AppError } from '../../utils/appError.js';

export class StockController {
  static async adjustStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.user?.userId;
      if (!adminId) {
        throw new AppError('Authentication required', 401, 'INVALID_TOKEN');
      }

      const { id } = req.params;
      const { stock, reason } = req.body;

      const product = await StockService.adjustStock(id, stock, reason, adminId);
      res.status(200).json(formatResponse('Stock adjusted successfully', product));
    } catch (error) {
      next(error);
    }
  }
}
