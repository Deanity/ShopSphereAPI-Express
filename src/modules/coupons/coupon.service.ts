import mongoose from 'mongoose';
import { Coupon, ICoupon } from './coupon.model.js';
import { Order } from '../orders/order.model.js';
import { AppError } from '../../utils/appError.js';

export interface ValidatedCouponResponse {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  discountAmount: number;
}

export class CouponService {
  static async validateCoupon(
    code: string,
    subtotal: number,
    userId: string,
    cartItems: Array<{ product: string; category: string }>,
  ): Promise<ValidatedCouponResponse> {
    const uppercaseCode = code.toUpperCase().trim();
    const coupon = await Coupon.findOne({ code: uppercaseCode });

    // Rule 1: Coupon exists and is active
    if (!coupon || !coupon.isActive) {
      throw new AppError('Coupon not found or inactive', 404, 'COUPON_NOT_FOUND');
    }

    // Rule 2: Current date is between startDate and endDate
    const now = new Date();
    if (now < coupon.startDate || now > coupon.endDate) {
      throw new AppError('Coupon has expired or is not active yet', 422, 'COUPON_EXPIRED');
    }

    // Rule 3: Global usage limit not exceeded
    if (coupon.usageCount >= coupon.usageLimit) {
      throw new AppError('Coupon usage limit reached', 422, 'COUPON_LIMIT_REACHED');
    }

    // Rule 4: Subtotal meets minOrderAmount
    if (subtotal < coupon.minOrderAmount) {
      throw new AppError(
        `Minimum order amount of IDR ${coupon.minOrderAmount} not met`,
        422,
        'COUPON_MIN_ORDER_NOT_MET',
      );
    }

    // Rule 5: Applicable products/categories checks
    const hasProductsLimit = coupon.applicableProducts && coupon.applicableProducts.length > 0;
    const hasCategoriesLimit = coupon.applicableCategories && coupon.applicableCategories.length > 0;

    if (hasProductsLimit || hasCategoriesLimit) {
      let isApplicable = false;

      for (const item of cartItems) {
        const matchesProduct =
          hasProductsLimit &&
          coupon.applicableProducts.some((pId) => pId.toString() === item.product);
        const matchesCategory =
          hasCategoriesLimit &&
          coupon.applicableCategories.some((cId) => cId.toString() === item.category);

        if (matchesProduct || matchesCategory) {
          isApplicable = true;
          break;
        }
      }

      if (!isApplicable) {
        throw new AppError(
          'Coupon is not applicable to any products in your cart',
          422,
          'COUPON_NOT_APPLICABLE',
        );
      }
    }

    // Rule 6: User-specific usage limit
    // We count non-cancelled orders by this user using this coupon
    const userUsageCount = await Order.countDocuments({
      user: new mongoose.Types.ObjectId(userId),
      'coupon.code': uppercaseCode,
      status: { $ne: 'cancelled' },
    });

    if (userUsageCount >= coupon.userUsageLimit) {
      throw new AppError(
        'You have reached your limit for this coupon',
        422,
        'COUPON_USER_LIMIT_EXCEEDED',
      );
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (coupon.type === 'percentage') {
      discountAmount = Math.round(subtotal * (coupon.value / 100));
      if (coupon.maxDiscountAmount !== undefined && coupon.maxDiscountAmount > 0) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
      }
    } else {
      // Fixed discount
      discountAmount = Math.min(coupon.value, subtotal);
    }

    return {
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discountAmount,
    };
  }

  // Admin CRUD Operations
  static async createCoupon(data: {
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    minOrderAmount?: number;
    maxDiscountAmount?: number;
    usageLimit: number;
    userUsageLimit?: number;
    applicableProducts?: string[];
    applicableCategories?: string[];
    startDate: string | Date;
    endDate: string | Date;
    isActive?: boolean;
  }): Promise<ICoupon> {
    const uppercaseCode = data.code.toUpperCase().trim();
    const existing = await Coupon.findOne({ code: uppercaseCode });
    if (existing) {
      throw new AppError('Coupon code already exists', 409, 'COUPON_CODE_EXISTS');
    }

    const coupon = await Coupon.create({
      ...data,
      code: uppercaseCode,
      applicableProducts: data.applicableProducts?.map((id) => new mongoose.Types.ObjectId(id)) || [],
      applicableCategories: data.applicableCategories?.map((id) => new mongoose.Types.ObjectId(id)) || [],
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
    });

    return coupon;
  }

  static async getCoupons(): Promise<ICoupon[]> {
    return Coupon.find({});
  }

  static async updateCoupon(
    id: string,
    data: Partial<{
      code: string;
      type: 'percentage' | 'fixed';
      value: number;
      minOrderAmount: number;
      maxDiscountAmount: number;
      usageLimit: number;
      userUsageLimit: number;
      applicableProducts: string[];
      applicableCategories: string[];
      startDate: string | Date;
      endDate: string | Date;
      isActive: boolean;
    }>,
  ): Promise<ICoupon> {
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      throw new AppError('Coupon not found', 404, 'COUPON_NOT_FOUND');
    }

    if (data.code) {
      const uppercaseCode = data.code.toUpperCase().trim();
      const existing = await Coupon.findOne({ code: uppercaseCode, _id: { $ne: id } });
      if (existing) {
        throw new AppError('Coupon code already exists', 409, 'COUPON_CODE_EXISTS');
      }
      coupon.code = uppercaseCode;
    }

    if (data.type !== undefined) coupon.type = data.type;
    if (data.value !== undefined) coupon.value = data.value;
    if (data.minOrderAmount !== undefined) coupon.minOrderAmount = data.minOrderAmount;
    if (data.maxDiscountAmount !== undefined) coupon.maxDiscountAmount = data.maxDiscountAmount;
    if (data.usageLimit !== undefined) coupon.usageLimit = data.usageLimit;
    if (data.userUsageLimit !== undefined) coupon.userUsageLimit = data.userUsageLimit;
    if (data.isActive !== undefined) coupon.isActive = data.isActive;

    if (data.applicableProducts !== undefined) {
      coupon.applicableProducts = data.applicableProducts.map((id) => new mongoose.Types.ObjectId(id));
    }
    if (data.applicableCategories !== undefined) {
      coupon.applicableCategories = data.applicableCategories.map((id) => new mongoose.Types.ObjectId(id));
    }
    if (data.startDate !== undefined) coupon.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) coupon.endDate = new Date(data.endDate);

    await coupon.save();
    return coupon;
  }

  static async deleteCoupon(id: string): Promise<void> {
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      throw new AppError('Coupon not found', 404, 'COUPON_NOT_FOUND');
    }
    await Coupon.deleteOne({ _id: id });
  }
}
