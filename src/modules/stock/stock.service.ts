import mongoose from 'mongoose';
import { Product } from '../products/product.model.js';
import { StockLog } from './stockLog.model.js';
import { AppError } from '../../utils/appError.js';

export class StockService {
  static async adjustStock(
    productId: string,
    newStock: number,
    reason: string,
    adminId: string,
  ): Promise<any> {
    const product = await Product.findById(productId);
    if (!product) {
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }

    const oldStock = product.stock;
    const quantityChanged = newStock - oldStock;

    product.stock = newStock;
    await product.save();

    // Log the manual stock adjustment
    await StockLog.create({
      product: product._id,
      adjustedBy: new mongoose.Types.ObjectId(adminId),
      quantityChanged,
      reason,
    });

    return product;
  }
}
