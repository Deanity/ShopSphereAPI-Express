import { Request, Response, NextFunction } from 'express';
import { CategoryService } from './category.service.js';
import { formatResponse } from '../../utils/formatResponse.js';

export class CategoryController {
  static async getTree(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tree = await CategoryService.getCategoryTree();
      res.status(200).json(formatResponse('Category tree retrieved successfully', tree));
    } catch (error) {
      next(error);
    }
  }

  static async getBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;
      const category = await CategoryService.getCategoryBySlug(slug);
      res.status(200).json(formatResponse('Category retrieved successfully', category));
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await CategoryService.createCategory(req.body);
      res.status(201).json(formatResponse('Category created successfully', category));
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const category = await CategoryService.updateCategory(id, req.body);
      res.status(200).json(formatResponse('Category updated successfully', category));
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await CategoryService.deleteCategory(id);
      res.status(200).json(formatResponse('Category deleted successfully'));
    } catch (error) {
      next(error);
    }
  }
}
