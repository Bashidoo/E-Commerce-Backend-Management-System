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
        // Try standard lowercase table first
        const { data, error } = await supabase
        .from('products')
        .select(`*, categories(*)`)
        .order('name', { ascending: true });

        if (error) {
             // Fallback to legacy
             const { data: legacyData } = await supabase
                .from('Products')
                .select(`*, Category:Categories(*)`)
                .order('Name', { ascending: true });
             
             return (legacyData || []).map((p: any) => this.mapProduct(p));
        }

        return data.map((p: any) => this.mapProduct(p));
    } catch (err) {
        console.error("InventoryService Error:", err);
        return [];
    }
  }

  async getAllCategories(): Promise<Category[]> {
    const supabase = getSupabase();
    if (!supabase) return [];

    // Try lowercase 'categories'
    const { data, error } = await supabase.from('categories').select('*');
    
    if (error) {
        // Fallback
        const { data: legacyData } = await supabase.from('Categories').select('*');
        return (legacyData || []).map((c: any) => ({
            id: c.Id,
            name: c.Name
        }));
    }
    
    return data.map((c: any) => ({
        id: c.id,
        name: c.name
    }));
  }

  async saveProduct(product: Partial<Product>): Promise<Product> {
    const supabase = this.getClient();
    
    // Payload for snake_case DB
    const payload: any = {
        name: product.name,
        description: product.description,
        price: product.price,
        stock_quantity: product.stockQuantity,
        image_url: product.imageUrl,
        category_id: product.categoryId,
        inspired_by: product.inspiredBy,
        gender: product.gender
    };

    try {
        let result;
        if (product.id) {
            // Update
            const { data, error } = await supabase
                .from('products')
                .update(payload)
                .eq('id', product.id)
                .select(`*, categories(*)`)
                .single();
            
            if (error) throw error; // Will catch below to try legacy
            result = data;
        } else {
            // Insert
            payload.is_deleted = false;
            const { data, error } = await supabase
                .from('products')
                .insert(payload)
                .select(`*, categories(*)`)
                .single();
            if (error) throw error;
            result = data;
        }
        return this.mapProduct(result);
    } catch (err) {
        // Legacy Save Fallback
        return this.saveProductLegacy(product);
    }
  }

  // Fallback for saving to PascalCase tables
  private async saveProductLegacy(product: Partial<Product>): Promise<Product> {
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
            .select(`*, Category:Categories(*)`)
            .single();
        if (error) throw error;
        return this.mapProduct(data);
    } else {
        payload.IsDeleted = false;
        const { data, error } = await supabase
            .from('Products')
            .insert(payload)
            .select(`*, Category:Categories(*)`)
            .single();
        if (error) throw error;
        return this.mapProduct(data);
    }
  }

  async deleteProduct(id: number): Promise<void> {
    const supabase = this.getClient();
    // Try both column styles just in case
    const { error } = await supabase.from('products').update({ is_deleted: true, deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) {
        await supabase.from('Products').update({ IsDeleted: true, DeletedAt: new Date().toISOString() }).eq('Id', id);
    }
  }

  async restoreProduct(id: number): Promise<void> {
    const supabase = this.getClient();
    const { error } = await supabase.from('products').update({ is_deleted: false, deleted_at: null }).eq('id', id);
    if (error) {
        await supabase.from('Products').update({ IsDeleted: false, DeletedAt: null }).eq('Id', id);
    }
  }

  async permanentDeleteProduct(id: number): Promise<void> {
    const supabase = this.getClient();
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
        await supabase.from('Products').delete().eq('Id', id);
    }
  }

  private mapProduct(dbItem: any): Product {
      const rawCat = dbItem.categories || dbItem.Category || dbItem.category;
      return {
          id: dbItem.id || dbItem.Id,
          name: dbItem.name || dbItem.Name,
          description: dbItem.description || dbItem.Description,
          imageUrl: dbItem.image_url || dbItem.ImageUrl,
          price: dbItem.price || dbItem.Price,
          stockQuantity: dbItem.stock_quantity || dbItem.StockQuantity,
          inspiredBy: dbItem.inspired_by || dbItem.InspiredBy,
          gender: dbItem.gender || dbItem.Gender,
          isOnSale: dbItem.is_on_sale || dbItem.IsOnSale,
          isNew: dbItem.is_new || dbItem.IsNew,
          rating: dbItem.rating || dbItem.Rating,
          reviewCount: dbItem.review_count || dbItem.ReviewCount,
          categoryId: dbItem.category_id || dbItem.CategoryId,
          category: rawCat ? { id: rawCat.id || rawCat.Id, name: rawCat.name || rawCat.Name } : undefined,
          isDeleted: dbItem.is_deleted || dbItem.IsDeleted,
          deletedAt: dbItem.deleted_at || dbItem.DeletedAt
      };
  }
}

export const inventoryService = new InventoryService();