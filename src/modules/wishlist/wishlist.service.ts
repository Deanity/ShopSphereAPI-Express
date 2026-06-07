import mongoose from 'mongoose';
import { Wishlist, IWishlist } from './wishlist.model.js';
import { Product } from '../products/product.model.js';
import { AppError } from '../../utils/appError.js';

export class WishlistService {
  static async getWishlist(userId: string): Promise<IWishlist> {
    let wishlist = await Wishlist.findOne({ user: new mongoose.Types.ObjectId(userId) });
    if (!wishlist) {
      wishlist = await Wishlist.create({
        user: new mongoose.Types.ObjectId(userId),
        products: [],
      });
    }

    await wishlist.populate({
      path: 'products',
      match: { isActive: true }, // Only retrieve active products
      select: '_id name slug price discountPercent stock images averageRating isActive',
    });

    return wishlist;
  }

  static async addToWishlist(userId: string, productId: string): Promise<IWishlist> {
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      throw new AppError('Product not found or inactive', 404, 'PRODUCT_NOT_FOUND');
    }

    let wishlist = await Wishlist.findOne({ user: new mongoose.Types.ObjectId(userId) });
    if (!wishlist) {
      wishlist = await Wishlist.create({
        user: new mongoose.Types.ObjectId(userId),
        products: [],
      });
    }

    const prodId = new mongoose.Types.ObjectId(productId);
    const hasProduct = wishlist.products.some((id) => id.toString() === productId);

    if (!hasProduct) {
      wishlist.products.push(prodId);
      await wishlist.save();
    }

    return this.getWishlist(userId);
  }

  static async removeFromWishlist(userId: string, productId: string): Promise<IWishlist> {
    const wishlist = await Wishlist.findOne({ user: new mongoose.Types.ObjectId(userId) });
    if (!wishlist) {
      throw new AppError('Wishlist not found', 404, 'WISHLIST_NOT_FOUND');
    }

    const initialLength = wishlist.products.length;
    wishlist.products = wishlist.products.filter((id) => id.toString() !== productId);

    if (wishlist.products.length === initialLength) {
      throw new AppError('Product not found in wishlist', 404, 'PRODUCT_NOT_IN_WISHLIST');
    }

    await wishlist.save();
    return this.getWishlist(userId);
  }
}
