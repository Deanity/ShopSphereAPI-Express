import mongoose, { Schema, Document } from 'mongoose';

export enum ReturnReason {
  DAMAGED = 'damaged',
  WRONG_ITEM = 'wrong_item',
  NOT_AS_DESCRIBED = 'not_as_described',
  DEFECTIVE = 'defective',
  OTHER = 'other',
}

export enum ReturnStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REFUNDED = 'refunded',
}

export interface IReturnItem {
  product: mongoose.Types.ObjectId;
  quantity: number;
  reason: string;
}

export interface IReturn extends Document {
  _id: mongoose.Types.ObjectId;
  order: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  items: IReturnItem[];
  reason: ReturnReason;
  description: string;
  images: string[];
  status: ReturnStatus;
  refundAmount: number;
  adminNotes?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const returnItemSchema = new Schema<IReturnItem>({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  reason: { type: String, required: true },
});

const returnSchema = new Schema<IReturn>(
  {
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items: [returnItemSchema],
    reason: { type: String, enum: Object.values(ReturnReason), required: true },
    description: { type: String, required: true },
    images: { type: [String], default: [] },
    status: {
      type: String,
      enum: Object.values(ReturnStatus),
      default: ReturnStatus.PENDING,
      required: true,
    },
    refundAmount: { type: Number, required: true, default: 0 },
    adminNotes: { type: String },
    resolvedAt: { type: Date },
  },
  {
    timestamps: true,
  },
);

export const Return = mongoose.model<IReturn>('Return', returnSchema);
