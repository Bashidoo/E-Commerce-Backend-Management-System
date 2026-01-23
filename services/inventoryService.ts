import { Product, Category } from '../types';

// Default to localhost for dev, using optional chaining to prevent crash if env is undefined
const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080/api';

class InventoryService {

  async getAllProducts(): Promise<Product[]> {
    try {
      const response = await fetch(`${API_URL}/products`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error("API Error:", error);
      return [];
    }
  }

  async getAllCategories(): Promise<Category[]> {
    // If you haven't created a CategoriesController yet, we can temporarily return mocks
    // or you can add the controller. Returning empty for now to prevent crash.
    return [
        { id: 1, name: "Perfume" },
        { id: 2, name: "Cologne" }
    ];
  }

  async saveProduct(product: Partial<Product>): Promise<Product> {
    const isEdit = !!product.id;
    const url = isEdit ? `${API_URL}/products/${product.id}` : `${API_URL}/products`;
    const method = isEdit ? 'PUT' : 'POST';

    const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
    });

    if (!response.ok) throw new Error("Failed to save product");
    return await response.json();
  }

  async deleteProduct(id: number): Promise<void> {
    // This calls the Soft Delete endpoint in our API
    await fetch(`${API_URL}/products/${id}`, { method: 'DELETE' });
  }

  async restoreProduct(id: number): Promise<void> {
    // Implementation depends on API support. 
    // Usually implies setting IsDeleted = false via PUT
    console.warn("Restore not yet implemented in API");
  }

  async permanentDeleteProduct(id: number): Promise<void> {
     // Admin only endpoint
     console.warn("Permanent delete not yet implemented in API");
  }
}

export const inventoryService = new InventoryService();