import mongoose from 'mongoose';
import { Product, IProduct } from './product.model.js';
import { Category } from '../categories/category.model.js';
import { AppError } from '../../utils/appError.js';

export interface QueryProductsParams {
  page: number;
  limit: number;
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStockOnly?: boolean;
  sort: 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'best_selling';
}

export interface PaginatedProductsResponse {
  products: IProduct[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class ProductService {
  static async createProduct(data: {
    name: string;
    description: string;
    price: number;
    discountPercent?: number;
    images: string[];
    category: string;
    stock: number;
    weight: number;
    tags?: string[];
  }): Promise<IProduct> {
    // Verify category exists
    const categoryExists = await Category.findById(data.category);
    if (!categoryExists) {
      throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
    }

    const product = await Product.create({
      ...data,
      category: new mongoose.Types.ObjectId(data.category),
      isActive: true,
      sold: 0,
      averageRating: 0,
      totalReviews: 0,
    });

    return product;
  }

  static async getProductBySlug(slug: string): Promise<IProduct> {
    const product = await Product.findOne({ slug, isActive: true }).populate(
      'category',
      '_id name',
    );
    if (!product) {
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }
    return product;
  }

  static async updateProduct(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      price: number;
      discountPercent: number;
      images: string[];
      category: string;
      stock: number;
      weight: number;
      tags: string[];
      isActive: boolean;
    }>,
  ): Promise<IProduct> {
    const product = await Product.findById(id);
    if (!product) {
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }

    if (data.category) {
      const categoryExists = await Category.findById(data.category);
      if (!categoryExists) {
        throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
      }
    }

    // Merge other fields
    Object.assign(product, {
      ...data,
      category: data.category ? new mongoose.Types.ObjectId(data.category) : product.category,
    });

    await product.save();
    return product;
  }

  static async deleteProduct(id: string): Promise<void> {
    const product = await Product.findById(id);
    if (!product) {
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }

    // Soft delete product
    product.isActive = false;
    await product.save();
  }

  static async queryProducts(params: QueryProductsParams): Promise<PaginatedProductsResponse> {
    const { page, limit, search, categoryId, minPrice, maxPrice, minRating, inStockOnly, sort } =
      params;

    const queryObj: mongoose.FilterQuery<IProduct> = { isActive: true };

    // Filter by category
    if (categoryId) {
      queryObj.category = new mongoose.Types.ObjectId(categoryId);
    }

    // Filter by stock
    if (inStockOnly) {
      queryObj.stock = { $gt: 0 };
    }

    // Filter by rating
    if (minRating !== undefined) {
      queryObj.averageRating = { $gte: minRating };
    }

    // Filter by base price range
    if (minPrice !== undefined || maxPrice !== undefined) {
      queryObj.price = {};
      if (minPrice !== undefined) queryObj.price.$gte = minPrice;
      if (maxPrice !== undefined) queryObj.price.$lte = maxPrice;
    }

    // Filter by text search (with local fallback mapping)
    if (search) {
      queryObj.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    // Determine sorting
    const sortObj: Record<string, 1 | -1> = {};
    if (sort === 'price_asc') {
      sortObj.price = 1;
    } else if (sort === 'price_desc') {
      sortObj.price = -1;
    } else if (sort === 'newest') {
      sortObj.createdAt = -1;
    } else if (sort === 'best_selling') {
      sortObj.sold = -1;
    } else {
      // relevance / default fallback
      sortObj.createdAt = -1;
    }

    // Pagination math
    const skip = (page - 1) * limit;
    const total = await Product.countDocuments(queryObj);
    const totalPages = Math.ceil(total / limit);

    const products = await Product.find(queryObj)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .populate('category', '_id name');

    return {
      products,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }
}
