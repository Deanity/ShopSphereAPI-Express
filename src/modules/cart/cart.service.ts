import mongoose from 'mongoose';
import { Cart, ICart } from './cart.model.js';
import { Product } from '../products/product.model.js';
import { AppError } from '../../utils/appError.js';

export interface CartResponseItem {
  product: {
    _id: string;
    name: string;
    price: number;
    discountPercent: number;
    discountedPrice: number;
    stock: number;
    images: string[];
    weight: number;
    category: string;
    isActive: boolean;
  };
  quantity: number;
  priceSnapshot: number;
  isAvailable: boolean;
}

export interface CartResponse {
  items: CartResponseItem[];
  summary: {
    totalItems: number;
    subtotal: number;
  };
}

export class CartService {
  static async getOrCreateCart(userId: string): Promise<CartResponse> {
    let cart = await Cart.findOne({ user: new mongoose.Types.ObjectId(userId) });
    if (!cart) {
      cart = await Cart.create({ user: new mongoose.Types.ObjectId(userId), items: [] });
    }

    // Populate products
    await cart.populate('items.product');

    let modified = false;
    const itemsResponse: CartResponseItem[] = [];
    let totalItems = 0;
    let subtotal = 0;

    for (const item of cart.items) {
      const prod = item.product as any; // Cast populated product

      // If product was deleted or is not found in database
      if (!prod) {
        continue;
      }

      // Update priceSnapshot to reflect the current product discounted price
      const currentPrice = prod.discountedPrice !== undefined ? prod.discountedPrice : prod.price;
      if (item.priceSnapshot !== currentPrice) {
        item.priceSnapshot = currentPrice;
        modified = true;
      }

      const isAvailable = prod.isActive && prod.stock > 0;

      itemsResponse.push({
        product: {
          _id: prod._id.toString(),
          name: prod.name,
          price: prod.price,
          discountPercent: prod.discountPercent,
          discountedPrice: currentPrice,
          stock: prod.stock,
          images: prod.images,
          weight: prod.weight,
          category: prod.category.toString(),
          isActive: prod.isActive,
        },
        quantity: item.quantity,
        priceSnapshot: item.priceSnapshot,
        isAvailable,
      });

      if (isAvailable) {
        totalItems += item.quantity;
        subtotal += item.quantity * item.priceSnapshot;
      }
    }

    if (modified) {
      await cart.save();
    }

    return {
      items: itemsResponse,
      summary: {
        totalItems,
        subtotal,
      },
    };
  }

  static async addItemToCart(
    userId: string,
    productId: string,
    quantity: number,
  ): Promise<CartResponse> {
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      throw new AppError('Product not found or inactive', 404, 'PRODUCT_NOT_FOUND');
    }

    if (product.stock < quantity) {
      throw new AppError('Insufficient stock available', 422, 'INSUFFICIENT_STOCK');
    }

    let cart = await Cart.findOne({ user: new mongoose.Types.ObjectId(userId) });
    if (!cart) {
      cart = await Cart.create({ user: new mongoose.Types.ObjectId(userId), items: [] });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId,
    );

    const currentPrice = product.discountedPrice;

    if (itemIndex > -1) {
      // Product already in cart, increment quantity
      const newQuantity = cart.items[itemIndex].quantity + quantity;
      if (product.stock < newQuantity) {
        throw new AppError('Insufficient stock available', 422, 'INSUFFICIENT_STOCK');
      }
      cart.items[itemIndex].quantity = newQuantity;
      cart.items[itemIndex].priceSnapshot = currentPrice;
    } else {
      // Add new item
      // Check max unique items limit
      if (cart.items.length >= 20) {
        throw new AppError('Maximum unique items in cart reached', 422, 'MAX_CART_ITEMS_REACHED');
      }

      cart.items.push({
        product: new mongoose.Types.ObjectId(productId),
        quantity,
        priceSnapshot: currentPrice,
      } as any);
    }

    await cart.save();
    return this.getOrCreateCart(userId);
  }

  static async updateItemQuantity(
    userId: string,
    productId: string,
    quantity: number,
  ): Promise<CartResponse> {
    const cart = await Cart.findOne({ user: new mongoose.Types.ObjectId(userId) });
    if (!cart) {
      throw new AppError('Cart not found', 404, 'CART_NOT_FOUND');
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId,
    );

    if (itemIndex === -1) {
      throw new AppError('Cart item not found', 404, 'CART_ITEM_NOT_FOUND');
    }

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      throw new AppError('Product not found or inactive', 404, 'PRODUCT_NOT_FOUND');
    }

    if (product.stock < quantity) {
      throw new AppError('Insufficient stock available', 422, 'INSUFFICIENT_STOCK');
    }

    cart.items[itemIndex].quantity = quantity;
    cart.items[itemIndex].priceSnapshot = product.discountedPrice;

    await cart.save();
    return this.getOrCreateCart(userId);
  }

  static async removeItemFromCart(userId: string, productId: string): Promise<CartResponse> {
    const cart = await Cart.findOne({ user: new mongoose.Types.ObjectId(userId) });
    if (!cart) {
      throw new AppError('Cart not found', 404, 'CART_NOT_FOUND');
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId,
    );

    if (itemIndex === -1) {
      throw new AppError('Cart item not found', 404, 'CART_ITEM_NOT_FOUND');
    }

    cart.items.splice(itemIndex, 1);
    await cart.save();

    return this.getOrCreateCart(userId);
  }

  static async clearCart(userId: string): Promise<void> {
    const cart = await Cart.findOne({ user: new mongoose.Types.ObjectId(userId) });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
  }
}
