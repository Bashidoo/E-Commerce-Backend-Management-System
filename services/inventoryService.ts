import { Product, Category } from '../types';
import { mockProducts, mockCategories } from './mockData';
import { getSupabase } from '../lib/supabaseClient';
import { productService } from './productService';

class InventoryService {
  // Use mockProducts and ensure deep copy to prevent reference issues
  // This internal state is mostly for mock mode now
  private products: Product[] = mockProducts.map(p => ({ 
    ...p, 
    isDeleted: p.isDeleted ?? false 
  }));
  
  private categories: Category[] = [...mockCategories];

  // Async get all products (Active and Soft Deleted)
  async getAllProducts(): Promise<Product[]> {
    // Priority: Check Supabase
    if (getSupabase()) {
        try {
            return await productService.getProducts();
        } catch (e) {
            console.error("Failed to fetch from Supabase, falling back to mock data", e);
            // Fallback continues below
        }
    }

    // Mock Implementation
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
    const supabase = getSupabase();
    
    // NOTE: For this specific task, we only implemented READ in productService.
    // Full CRUD with Supabase would be implemented in productService similarly.
    // For now, we update local mock state so the UI feels responsive even if DB write isn't fully wired in this task.
    
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
            const existingProduct = this.products[index];
            const updated = { 
                ...existingProduct, 
                ...product, 
                // Preserve critical flags if not provided in update
                isDeleted: existingProduct.isDeleted,
                deletedAt: existingProduct.deletedAt,
                category 
            } as Product;
            
            // Immutable update using map
            this.products = this.products.map(p => p.id === product.id ? updated : p);
            resolve(updated);
          } else {
            reject(new Error("Product not found"));
          }
        } else {
          // Create
          const newProduct = {
            ...product,
            id: (this.products.length > 0 ? Math.max(...this.products.map(p => p.id)) : 100) + 1,
            category,
            reviewCount: 0,
            rating: 0,
            isDeleted: false, // Ensure new products are active
            deletedAt: null
          } as Product;
          this.products = [...this.products, newProduct];
          resolve(newProduct);
        }
      }, 600); // Simulate network/DB latency
    });
  }

  // Soft Delete Product (Move to Trash)
  async deleteProduct(id: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Use map to immutably update the specific product
        this.products = this.products.map(p => {
          if (p.id === id) {
            return {
              ...p,
              isDeleted: true,
              deletedAt: new Date().toISOString()
            };
          }
          return p;
        });
        resolve();
      }, 400);
    });
  }

  // Restore Product from Trash
  async restoreProduct(id: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Use map to immutably update the specific product
        this.products = this.products.map(p => {
          if (p.id === id) {
            return {
              ...p,
              isDeleted: false,
              deletedAt: null
            };
          }
          return p;
        });
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
