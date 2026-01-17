import { getSupabase } from '../lib/supabaseClient';
import { Product, Category } from '../types';

// DB Interfaces based on SQL Schema provided
export interface DBProduct {
  Id: number;
  Name: string;
  Price: number;
  StockQuantity: number;
  ImageUrl: string;
  Gender: string; // 'Men', 'Women', 'Unisex'
  Category: string; // Name of the category
  IsDeleted?: boolean;
  DeletedAt?: string;
}

class ProductService {
  
  async getProducts(): Promise<Product[]> {
    const supabase = getSupabase();
    if (!supabase) {
      throw new Error("Supabase client not initialized");
    }

    // Use .eq for boolean check instead of .is
    const { data, error } = await supabase
      .from('Products')
      .select('*')
      .eq('IsDeleted', false);

    if (error) {
      console.error("Supabase Fetch Error:", error);
      throw error;
    }

    if (!data) return [];

    // Map DB (PascalCase) to Domain (camelCase)
    return data.map((item: any) => this.mapDBToDomain(item));
  }

  // Mapper to convert DB shape to Frontend shape
  private mapDBToDomain(dbItem: any): Product {
    // Ensure category name is a string to prevent rendering objects
    const categoryName = typeof dbItem.Category === 'string' 
        ? dbItem.Category 
        : (dbItem.Category?.name || 'Uncategorized');

    const category: Category = {
        id: 0, 
        name: String(categoryName || 'Uncategorized')
    };

    return {
      id: dbItem.Id,
      name: dbItem.Name,
      description: '', 
      imageUrl: dbItem.ImageUrl,
      price: dbItem.Price,
      stockQuantity: dbItem.StockQuantity,
      inspiredBy: '', 
      gender: (dbItem.Gender as 'Men' | 'Women' | 'Unisex') || 'Unisex',
      isOnSale: false, 
      isNew: false, 
      rating: 0, 
      reviewCount: 0, 
      categoryId: 0,
      category: category,
      isDeleted: !!dbItem.IsDeleted,
      deletedAt: dbItem.DeletedAt
    };
  }
}

export const productService = new ProductService();
