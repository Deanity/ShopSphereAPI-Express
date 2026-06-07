import { Request, Response, NextFunction } from 'express';
import { ShippingService } from './shipping.service.js';
import { formatResponse } from '../../utils/formatResponse.js';

export class ShippingController {
  static async getProvinces(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const provinces = await ShippingService.getProvinces();
      res.status(200).json(formatResponse('Provinces retrieved successfully', provinces));
    } catch (error) {
      next(error);
    }
  }

  static async getCities(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { provinceId } = req.query;
      const cities = await ShippingService.getCities(provinceId as string | undefined);
      res.status(200).json(formatResponse('Cities retrieved successfully', cities));
    } catch (error) {
      next(error);
    }
  }

  static async calculateCost(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { destinationCityId, weight, courier } = req.body;
      const costData = await ShippingService.calculateCost(destinationCityId, weight, courier);
      res.status(200).json(formatResponse('Shipping cost calculated successfully', costData));
    } catch (error) {
      next(error);
    }
  }
}
