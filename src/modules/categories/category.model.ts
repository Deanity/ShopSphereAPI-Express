import mongoose, { Schema, Document } from 'mongoose';
import { slugify } from '../../utils/slugify.js';

export interface ICategory extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  parent?: mongoose.Types.ObjectId | null;
  image?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true, trim: true },
    parent: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    image: { type: String },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  },
);

categorySchema.pre('validate', function (next) {
  if (this.isModified('name') && this.name) {
    this.slug = slugify(this.name);
  }
  next();
});

export const Category = mongoose.model<ICategory>('Category', categorySchema);
