import mongoose from 'mongoose';
import { connectDB } from './db.js';
import { User } from '../modules/users/user.model.js';
import { Category } from '../modules/categories/category.model.js';
import { Product } from '../modules/products/product.model.js';

const seedData = async () => {
  try {
    await connectDB();

    const isReset = process.argv.includes('--reset');
    if (isReset) {
      console.log('🗑️ Resetting database: dropping collections...');
      
      // We drop or clean the collections
      await User.deleteMany({});
      await Category.deleteMany({});
      await Product.deleteMany({});
      console.log('✅ Collections dropped.');
    }

    console.log('🌱 Seeding database...');

    // 1. Create Admin & Customer Users
    const adminExists = await User.findOne({ email: 'admin@example.com' });
    if (!adminExists) {
      await User.create({
        name: 'Admin ShopSphere',
        email: 'admin@example.com',
        password: 'adminpassword123', // Will be hashed via pre-save middleware
        role: 'admin',
        isActive: true,
      });
      console.log('👤 Admin user created: admin@example.com / adminpassword123');
    } else {
      console.log('👤 Admin user already exists');
    }

    const customerExists = await User.findOne({ email: 'customer@example.com' });
    if (!customerExists) {
      await User.create({
        name: 'John Doe',
        email: 'customer@example.com',
        password: 'customerpassword123',
        role: 'customer',
        isActive: true,
        addresses: [
          {
            label: 'Home',
            recipientName: 'John Doe',
            phone: '081234567890',
            province: 'DKI Jakarta',
            city: 'Jakarta Selatan',
            district: 'Kebayoran Baru',
            postalCode: '12110',
            fullAddress: 'Sudirman Street No. 45',
            isDefault: true,
          },
        ],
      });
      console.log('👤 Customer user created: customer@example.com / customerpassword123');
    } else {
      console.log('👤 Customer user already exists');
    }

    // 2. Create Categories
    const categoriesData = [
      { name: 'Electronics', slug: 'electronics' },
      { name: 'Clothing', slug: 'clothing' },
      { name: 'Home & Living', slug: 'home-and-living' },
    ];

    const seededCategories = [];
    for (const cat of categoriesData) {
      let category = await Category.findOne({ slug: cat.slug });
      if (!category) {
        category = await Category.create({ name: cat.name, isActive: true });
        console.log(`🏷️ Category created: ${cat.name}`);
      } else {
        console.log(`🏷️ Category already exists: ${cat.name}`);
      }
      seededCategories.push(category);
    }

    const electronicsCategory = seededCategories.find((c) => c.slug === 'electronics');
    const clothingCategory = seededCategories.find((c) => c.slug === 'clothing');

    // 3. Create Products
    if (electronicsCategory && clothingCategory) {
      const productsData = [
        {
          name: 'iPhone 15 Pro',
          description: 'Latest model with titanium chassis and A17 Pro chip.',
          price: 20000000,
          discountPercent: 10,
          images: ['https://placehold.co/600x400/png?text=iPhone+15+Pro'],
          category: electronicsCategory._id,
          stock: 50,
          weight: 187,
          tags: ['apple', 'phone', 'ios', 'electronics'],
        },
        {
          name: 'Samsung Galaxy S24',
          description: 'Flagship Android phone with Galaxy AI.',
          price: 15000000,
          discountPercent: 5,
          images: ['https://placehold.co/600x400/png?text=Galaxy+S24'],
          category: electronicsCategory._id,
          stock: 30,
          weight: 196,
          tags: ['samsung', 'phone', 'android', 'electronics'],
        },
        {
          name: 'Premium Cotton T-Shirt',
          description: '100% organic cotton basic t-shirt in black.',
          price: 150000,
          discountPercent: 0,
          images: ['https://placehold.co/600x400/png?text=Premium+T-Shirt'],
          category: clothingCategory._id,
          stock: 100,
          weight: 150,
          tags: ['clothing', 't-shirt', 'cotton', 'fashion'],
        },
      ];

      for (const prod of productsData) {
        const slug = prod.name.toLowerCase().replace(/ /g, '-');
        const prodExists = await Product.findOne({ slug });
        if (!prodExists) {
          await Product.create(prod);
          console.log(`📦 Product created: ${prod.name}`);
        } else {
          console.log(`📦 Product already exists: ${prod.name}`);
        }
      }
    }

    console.log('✅ Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
