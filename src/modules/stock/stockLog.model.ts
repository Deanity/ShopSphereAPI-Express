import mongoose, { Schema, Document } from 'mongoose';

export interface IStockLog extends Document {
  product: mongoose.Types.ObjectId;
  adjustedBy: mongoose.Types.ObjectId;
  quantityChanged: number;
  reason: string;
  createdAt: Date;
}

const stockLogSchema = new Schema<IStockLog>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    adjustedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    quantityChanged: { type: Number, required: true },
    reason: { type: String, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

export const StockLog = mongoose.model<IStockLog>('StockLog', stockLogSchema);
