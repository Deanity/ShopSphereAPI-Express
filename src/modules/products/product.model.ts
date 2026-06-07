import mongoose, { Schema, Document } from 'mongoose';
import { slugify } from '../../utils/slugify.js';

export interface IProduct extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  price: number;
  discountPercent: number;
  images: string[];
  category: mongoose.Types.ObjectId;
  stock: number;
  weight: number;
  sold: number;
  averageRating: number;
  totalReviews: number;
  isActive: boolean;
  tags: string[];
  discountedPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    images: { type: [String], required: true, default: [] },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    stock: { type: Number, required: true, min: 0, default: 0 },
    weight: { type: Number, required: true, min: 0 }, // in grams
    sold: { type: Number, default: 0, min: 0 },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
    tags: { type: [String], default: [] },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

productSchema.pre('validate', function (next) {
  if (this.isModified('name') && this.name) {
    this.slug = slugify(this.name);
  }
  next();
});

productSchema.virtual('discountedPrice').get(function (this: IProduct) {
  return Math.round(this.price * (1 - this.discountPercent / 100));
});

export const Product = mongoose.model<IProduct>('Product', productSchema);
