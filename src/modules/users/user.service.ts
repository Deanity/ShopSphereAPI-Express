import mongoose from 'mongoose';
import { User, IUser, IUserAddress } from './user.model.js';
import { AppError } from '../../utils/appError.js';

export class UserService {
  static async getUserProfile(userId: string): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }
    return user;
  }

  static async updateUserProfile(
    userId: string,
    data: { name?: string; phone?: string; avatar?: string },
  ): Promise<IUser> {
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: data },
      { new: true, runValidators: true },
    );
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }
    return user;
  }

  static async addAddress(
    userId: string,
    data: Omit<IUserAddress, '_id'>,
  ): Promise<IUserAddress[]> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // If this is the first address, force it to be default
    const isDefault = user.addresses.length === 0 ? true : !!data.isDefault;

    // If the new address is default, reset all other addresses
    if (isDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    const newAddress = {
      _id: new mongoose.Types.ObjectId(),
      ...data,
      isDefault,
    } as IUserAddress;

    user.addresses.push(newAddress);
    await user.save();

    return user.addresses;
  }

  static async updateAddress(
    userId: string,
    addressId: string,
    data: Partial<Omit<IUserAddress, '_id'>>,
  ): Promise<IUserAddress[]> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const address = user.addresses.find((addr) => addr._id.toString() === addressId);
    if (!address) {
      throw new AppError('Address not found', 404, 'ADDRESS_NOT_FOUND');
    }

    // Handle isDefault changes
    if (data.isDefault === true) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
      address.isDefault = true;
    } else if (data.isDefault === false && address.isDefault) {
      // If client attempts to unset default, prevent it if it's the only address
      if (user.addresses.length > 1) {
        address.isDefault = false;
        // Set another address as default
        const otherAddr = user.addresses.find((addr) => addr._id.toString() !== addressId);
        if (otherAddr) otherAddr.isDefault = true;
      }
    }

    // Merge other fields
    Object.assign(address, {
      label: data.label ?? address.label,
      recipientName: data.recipientName ?? address.recipientName,
      phone: data.phone ?? address.phone,
      province: data.province ?? address.province,
      city: data.city ?? address.city,
      district: data.district ?? address.district,
      postalCode: data.postalCode ?? address.postalCode,
      fullAddress: data.fullAddress ?? address.fullAddress,
    });

    await user.save();
    return user.addresses;
  }

  static async deleteAddress(userId: string, addressId: string): Promise<IUserAddress[]> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const addressIndex = user.addresses.findIndex((addr) => addr._id.toString() === addressId);
    if (addressIndex === -1) {
      throw new AppError('Address not found', 404, 'ADDRESS_NOT_FOUND');
    }

    const wasDefault = user.addresses[addressIndex].isDefault;
    user.addresses.splice(addressIndex, 1);

    // If we deleted the default address, set the first remaining address as default
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    return user.addresses;
  }

  static async setDefaultAddress(userId: string, addressId: string): Promise<IUserAddress[]> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const address = user.addresses.find((addr) => addr._id.toString() === addressId);
    if (!address) {
      throw new AppError('Address not found', 404, 'ADDRESS_NOT_FOUND');
    }

    user.addresses.forEach((addr) => {
      addr.isDefault = addr._id.toString() === addressId;
    });

    await user.save();
    return user.addresses;
  }
}
