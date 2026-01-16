import { Product, Category } from '../types';
import { mockProducts, mockCategories } from './mockData';

class InventoryService {
  private products: Product[] = [...mockProducts];
  private categories: Category[] = [...mockCategories];

  // Async get all products (Active and Soft Deleted)
  async getAllProducts(): Promise<Product[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...this.products]);
      }, 500);
    });
  }

  // Async get all categories
  async getAllCategories(): Promise<Category[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...this.categories]);
      }, 300);
    });
  }

  // Create or Update Product
  async saveProduct(product: Partial<Product>): Promise<Product> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Validation Logic
        if (!product.name || !product.price || product.price < 0) {
          reject(new Error("Invalid product data"));
          return;
        }

        const category = this.categories.find(c => c.id === product.categoryId);

        if (product.id) {
          // Update
          const index = this.products.findIndex(p => p.id === product.id);
          if (index !== -1) {
            const updated = { 
                ...this.products[index], 
                ...product, 
                category 
            } as Product;
            this.products[index] = updated;
            resolve(updated);
          } else {
            reject(new Error("Product not found"));
          }
        } else {
          // Create
          const newProduct = {
            ...product,
            id: Math.max(...this.products.map(p => p.id), 0) + 1,
            category,
            reviewCount: 0,
            rating: 0,
            isDeleted: false
          } as Product;
          this.products.push(newProduct);
          resolve(newProduct);
        }
      }, 600); // Simulate network/DB latency
    });
  }

  // Soft Delete Product (Move to Trash)
  async deleteProduct(id: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = this.products.findIndex(p => p.id === id);
        if (index !== -1) {
            this.products[index].isDeleted = true;
        }
        resolve();
      }, 400);
    });
  }

  // Restore Product from Trash
  async restoreProduct(id: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = this.products.findIndex(p => p.id === id);
        if (index !== -1) {
            this.products[index].isDeleted = false;
        }
        resolve();
      }, 400);
    });
  }

  // Permanent Delete
  async permanentDeleteProduct(id: number): Promise<void> {
      return new Promise((resolve) => {
          setTimeout(() => {
              this.products = this.products.filter(p => p.id !== id);
              resolve();
          }, 400);
      });
  }
}

export const inventoryService = new InventoryService();