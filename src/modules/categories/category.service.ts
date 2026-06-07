import mongoose from 'mongoose';
import { Category, ICategory } from './category.model.js';
import { AppError } from '../../utils/appError.js';

export interface CategoryNode {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  parent: string | null;
  children: CategoryNode[];
}

export class CategoryService {
  static async createCategory(data: {
    name: string;
    parent?: string | null;
    image?: string;
    isActive?: boolean;
  }): Promise<ICategory> {
    // If parent is provided, verify it exists
    if (data.parent) {
      const parentExists = await Category.findById(data.parent);
      if (!parentExists) {
        throw new AppError('Parent category not found', 404, 'CATEGORY_NOT_FOUND');
      }
    }

    const category = await Category.create({
      name: data.name,
      parent: data.parent || null,
      image: data.image,
      isActive: data.isActive !== undefined ? data.isActive : true,
    });

    return category;
  }

  static async getCategoryBySlug(slug: string): Promise<ICategory> {
    const category = await Category.findOne({ slug, isActive: true });
    if (!category) {
      throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
    }
    return category;
  }

  static async updateCategory(
    id: string,
    data: {
      name?: string;
      parent?: string | null;
      image?: string;
      isActive?: boolean;
    },
  ): Promise<ICategory> {
    const category = await Category.findById(id);
    if (!category) {
      throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
    }

    if (data.parent) {
      if (data.parent === id) {
        throw new AppError('Category cannot be its own parent', 400, 'INVALID_PARENT');
      }
      const parentExists = await Category.findById(data.parent);
      if (!parentExists) {
        throw new AppError('Parent category not found', 404, 'CATEGORY_NOT_FOUND');
      }
    }

    // Update fields
    if (data.name !== undefined) category.name = data.name;
    if (data.parent !== undefined) {
      category.parent = data.parent ? (data.parent as unknown as mongoose.Types.ObjectId) : null;
    }
    if (data.image !== undefined) category.image = data.image;
    if (data.isActive !== undefined) category.isActive = data.isActive;

    await category.save();
    return category;
  }

  static async deleteCategory(id: string): Promise<void> {
    const category = await Category.findById(id);
    if (!category) {
      throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
    }

    // Update children to have parent = null, preventing broken references
    await Category.updateMany({ parent: id }, { $set: { parent: null } });

    await Category.deleteOne({ _id: id });
  }

  static async getCategoryTree(): Promise<CategoryNode[]> {
    const categories = await Category.find({ isActive: true }).lean();

    // Map categories to node format
    const nodes: CategoryNode[] = categories.map((cat) => ({
      _id: cat._id.toString(),
      name: cat.name,
      slug: cat.slug,
      image: cat.image,
      parent: cat.parent ? cat.parent.toString() : null,
      children: [],
    }));

    // Create a map of ID to node
    const nodeMap = new Map<string, CategoryNode>();
    nodes.forEach((node) => nodeMap.set(node._id, node));

    const tree: CategoryNode[] = [];

    // Build the tree
    nodes.forEach((node) => {
      if (node.parent) {
        const parentNode = nodeMap.get(node.parent);
        if (parentNode) {
          parentNode.children.push(node);
        } else {
          // If parent not active or not found, treat as root
          tree.push(node);
        }
      } else {
        tree.push(node);
      }
    });

    return tree;
  }
}
