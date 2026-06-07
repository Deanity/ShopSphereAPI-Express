import mongoose, { Schema, Document } from 'mongoose';

export enum OrderStatus {
  PENDING_PAYMENT = 'pending_payment',
  PAID = 'paid',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  EXPIRED = 'expired',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

export interface IShippingAddress {
  recipientName: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  postalCode: string;
  fullAddress: string;
}

export interface IShippingDetails {
  courier: string;
  service: string;
  cost: number;
  estimatedDays: string;
}

export interface ICouponDetails {
  code: string;
  discountAmount: number;
}

export interface IOrder extends Document {
  _id: mongoose.Types.ObjectId;
  orderNumber: string;
  user: mongoose.Types.ObjectId;
  items: IOrderItem[];
  shippingAddress: IShippingAddress;
  shipping: IShippingDetails;
  coupon?: ICouponDetails;
  subtotal: number;
  shippingCost: number;
  discountAmount: number;
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  xenditInvoiceId?: string;
  xenditInvoiceUrl?: string;
  trackingNumber?: string;
  paidAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
});

const shippingAddressSchema = new Schema<IShippingAddress>({
  recipientName: { type: String, required: true },
  phone: { type: String, required: true },
  province: { type: String, required: true },
  city: { type: String, required: true },
  district: { type: String, required: true },
  postalCode: { type: String, required: true },
  fullAddress: { type: String, required: true },
});

const shippingDetailsSchema = new Schema<IShippingDetails>({
  courier: { type: String, required: true },
  service: { type: String, required: true },
  cost: { type: Number, required: true, min: 0 },
  estimatedDays: { type: String, required: true },
});

const couponDetailsSchema = new Schema<ICouponDetails>({
  code: { type: String, required: true },
  discountAmount: { type: Number, required: true, min: 0 },
});

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items: { type: [orderItemSchema], required: true },
    shippingAddress: { type: shippingAddressSchema, required: true },
    shipping: { type: shippingDetailsSchema, required: true },
    coupon: { type: couponDetailsSchema },
    subtotal: { type: Number, required: true, min: 0 },
    shippingCost: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, required: true, min: 0, default: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING_PAYMENT,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
      required: true,
    },
    xenditInvoiceId: { type: String },
    xenditInvoiceUrl: { type: String },
    trackingNumber: { type: String },
    paidAt: { type: Date },
    notes: { type: String },
  },
  {
    timestamps: true,
  },
);

export const Order = mongoose.model<IOrder>('Order', orderSchema);
