import { Product, Category } from '../types';
import { getSupabase } from '../lib/supabaseClient';

class InventoryService {

  private getClient() {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase client not initialized");
    return supabase;
  }

  async getAllProducts(): Promise<Product[]> {
    const supabase = getSupabase();
    if (!supabase) return [];

    try {
        // Query "Products" (PascalCase)
        const { data, error } = await supabase
        .from('Products')
        .select(`*, Categories(*)`)
        .order('Name', { ascending: true });

        if (error) {
             console.error("InventoryService Error:", error);
             return [];
        }

        return (data || []).map((p: any) => this.mapProduct(p));
    } catch (err) {
        console.error("InventoryService Exception:", err);
        return [];
    }
  }

  async getAllCategories(): Promise<Category[]> {
    const supabase = getSupabase();
    if (!supabase) return [];

    // Query "Categories" (PascalCase)
    const { data, error } = await supabase.from('Categories').select('*');
    
    if (error) {
        console.error("Category Fetch Error:", error);
        return [];
    }
    
    return data.map((c: any) => ({
        id: c.Id,
        name: c.Name
    }));
  }

  async saveProduct(product: Partial<Product>): Promise<Product> {
    const supabase = this.getClient();
    
    const payload: any = {
        Name: product.name,
        Description: product.description,
        Price: product.price,
        StockQuantity: product.stockQuantity,
        ImageUrl: product.imageUrl,
        CategoryId: product.categoryId,
        InspiredBy: product.inspiredBy,
        Gender: product.gender
    };

    if (product.id) {
        const { data, error } = await supabase
            .from('Products')
            .update(payload)
            .eq('Id', product.id)
            .select(`*, Categories(*)`)
            .single();
        
        if (error) throw error;
        return this.mapProduct(data);
    } else {
        payload.IsDeleted = false;
        const { data, error } = await supabase
            .from('Products')
            .insert(payload)
            .select(`*, Categories(*)`)
            .single();
        if (error) throw error;
        return this.mapProduct(data);
    }
  }

  async deleteProduct(id: number): Promise<void> {
    const supabase = this.getClient();
    await supabase.from('Products').update({ IsDeleted: true, DeletedAt: new Date().toISOString() }).eq('Id', id);
  }

  async restoreProduct(id: number): Promise<void> {
    const supabase = this.getClient();
    await supabase.from('Products').update({ IsDeleted: false, DeletedAt: null }).eq('Id', id);
  }

  async permanentDeleteProduct(id: number): Promise<void> {
    const supabase = this.getClient();
    await supabase.from('Products').delete().eq('Id', id);
  }

  private mapProduct(dbItem: any): Product {
      const rawCat = dbItem.Categories || dbItem.categories;
      return {
          id: dbItem.Id,
          name: dbItem.Name,
          description: dbItem.Description,
          imageUrl: dbItem.ImageUrl,
          price: dbItem.Price,
          stockQuantity: dbItem.StockQuantity,
          inspiredBy: dbItem.InspiredBy,
          gender: dbItem.Gender,
          isOnSale: dbItem.IsOnSale,
          isNew: dbItem.IsNew,
          rating: dbItem.Rating,
          reviewCount: dbItem.ReviewCount,
          categoryId: dbItem.CategoryId,
          category: rawCat ? { id: rawCat.Id, name: rawCat.Name } : undefined,
          isDeleted: dbItem.IsDeleted,
          deletedAt: dbItem.DeletedAt
      };
  }
}

export const inventoryService = new InventoryService();