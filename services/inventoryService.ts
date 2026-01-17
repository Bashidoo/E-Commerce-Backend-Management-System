import { Product, Category } from '../types';
import { getSupabase } from '../lib/supabaseClient';

class InventoryService {
  
  // Helper to ensure we have a client or throw
  private getClient() {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Database not configured. Please check settings.");
    return supabase;
  }

  async getAllProducts(): Promise<Product[]> {
    const supabase = getSupabase();
    if (!supabase) return [];

    // Fetch products with Category join
    const { data, error } = await supabase
      .from('Products')
      .select(`
        *,
        Category:Categories(*)
      `)
      .order('Id', { ascending: true });

    if (error) {
      console.error("Error fetching products:", error);
      return [];
    }

    return (data || []).map((item: any) => this.mapDBProductToDomain(item));
  }

  async getAllCategories(): Promise<Category[]> {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('Categories')
      .select('*')
      .order('Name', { ascending: true });

    if (error) {
      console.error("Error fetching categories:", error);
      return [];
    }

    return (data || []).map((c: any) => ({
      id: c.Id,
      name: c.Name
    }));
  }

  async saveProduct(product: Partial<Product>): Promise<Product> {
    const supabase = this.getClient();

    // Map Domain -> DB
    const dbPayload: any = {
      Name: product.name,
      Description: product.description,
      Price: product.price,
      StockQuantity: product.stockQuantity,
      ImageUrl: product.imageUrl,
      CategoryId: product.categoryId,
      Gender: product.gender,
      InspiredBy: product.inspiredBy,
      // Default fields if new
      IsDeleted: false,
      ReviewCount: product.reviewCount || 0,
      Rating: product.rating || 0
    };

    let result: any;
    
    if (product.id) {
      // Update
      const { data, error } = await supabase
        .from('Products')
        .update(dbPayload)
        .eq('Id', product.id)
        .select(`*, Category:Categories(*)`)
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create
      const { data, error } = await supabase
        .from('Products')
        .insert(dbPayload)
        .select(`*, Category:Categories(*)`)
        .single();

      if (error) throw error;
      result = data;
    }

    return this.mapDBProductToDomain(result);
  }

  async deleteProduct(id: number): Promise<void> {
    const supabase = this.getClient();
    const { error } = await supabase
      .from('Products')
      .update({ IsDeleted: true, DeletedAt: new Date().toISOString() })
      .eq('Id', id);
    
    if (error) throw error;
  }

  async restoreProduct(id: number): Promise<void> {
    const supabase = this.getClient();
    const { error } = await supabase
      .from('Products')
      .update({ IsDeleted: false, DeletedAt: null })
      .eq('Id', id);
      
    if (error) throw error;
  }

  async permanentDeleteProduct(id: number): Promise<void> {
    const supabase = this.getClient();
    const { error } = await supabase
      .from('Products')
      .delete()
      .eq('Id', id);
      
    if (error) throw error;
  }

  // --- Mappers ---

  private mapDBProductToDomain(dbItem: any): Product {
    // Handle Category join which returns an object or array
    let category: Category | undefined;
    if (dbItem.Category) {
       // If it's an array (sometimes joins return arrays), take first
       const catData = Array.isArray(dbItem.Category) ? dbItem.Category[0] : dbItem.Category;
       if (catData) {
           category = { id: catData.Id, name: catData.Name };
       }
    }

    return {
      id: dbItem.Id,
      name: dbItem.Name,
      description: dbItem.Description || '',
      imageUrl: dbItem.ImageUrl,
      price: dbItem.Price,
      stockQuantity: dbItem.StockQuantity,
      inspiredBy: dbItem.InspiredBy || '',
      gender: dbItem.Gender,
      isOnSale: false, // Not in DB schema provided
      isNew: false, // Not in DB schema provided
      rating: dbItem.Rating || 0,
      reviewCount: dbItem.ReviewCount || 0,
      categoryId: dbItem.CategoryId,
      category: category,
      isDeleted: dbItem.IsDeleted,
      deletedAt: dbItem.DeletedAt
    };
  }
}

export const inventoryService = new InventoryService();
