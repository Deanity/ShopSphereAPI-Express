import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUserAddress {
  _id: mongoose.Types.ObjectId;
  label: string;
  recipientName: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  postalCode: string;
  fullAddress: string;
  isDefault: boolean;
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  role: 'customer' | 'admin';
  phone?: string;
  avatar?: string;
  addresses: IUserAddress[];
  isActive: boolean;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  comparePassword(candidate: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new Schema<IUserAddress>({
  label: { type: String, required: true },
  recipientName: { type: String, required: true },
  phone: { type: String, required: true },
  province: { type: String, required: true },
  city: { type: String, required: true },
  district: { type: String, required: true },
  postalCode: { type: String, required: true },
  fullAddress: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
});

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    phone: { type: String },
    avatar: { type: String },
    addresses: { type: [addressSchema], default: [] },
    isActive: { type: Boolean, default: true },
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },
  },
  {
    timestamps: true,
  },
);

// Hash password before saving if it is modified or new
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 12);
    }
    next();
  } catch (err) {
    next(err as Error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

export const User = mongoose.model<IUser>('User', userSchema);
export type UserDocument = IUser & Document;
export type UserAddressDocument = IUserAddress;
