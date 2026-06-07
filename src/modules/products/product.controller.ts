import { Request, Response, NextFunction } from 'express';
import { ProductService, QueryProductsParams } from './product.service.js';
import { formatResponse } from '../../utils/formatResponse.js';

export class ProductController {
  static async getProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Cast parsed req.query to match our QueryProductsParams type structure
      const queryParams = req.query as unknown as QueryProductsParams;
      const { products, meta } = await ProductService.queryProducts(queryParams);

      res.status(200).json(formatResponse('Products retrieved successfully', products, meta));
    } catch (error) {
      next(error);
    }
  }

  static async getBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;
      const product = await ProductService.getProductBySlug(slug);

      res.status(200).json(formatResponse('Product retrieved successfully', product));
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await ProductService.createProduct(req.body);

      res.status(201).json(formatResponse('Product created successfully', product));
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const product = await ProductService.updateProduct(id, req.body);

      res.status(200).json(formatResponse('Product updated successfully', product));
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await ProductService.deleteProduct(id);

      res.status(200).json(formatResponse('Product deleted successfully'));
    } catch (error) {
      next(error);
    }
  }
}
