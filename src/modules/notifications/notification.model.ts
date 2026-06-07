import mongoose, { Schema, Document } from 'mongoose';

export enum NotificationType {
  ORDER_CREATED = 'order_created',
  PAYMENT_SUCCESS = 'payment_success',
  ORDER_SHIPPED = 'order_shipped',
  ORDER_DELIVERED = 'order_delivered',
  RETURN_APPROVED = 'return_approved',
  RETURN_REJECTED = 'return_rejected',
  LOW_STOCK = 'low_stock',
}

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
  isRead: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: Object.values(NotificationType), required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    data: { type: Map, of: String },
    isRead: { type: Boolean, default: false, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
