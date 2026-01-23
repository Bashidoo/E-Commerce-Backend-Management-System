import { Order, OrderItem, User } from '../types';
import { getSupabase } from '../lib/supabaseClient';

class OrderService {
  
  private getClient() {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase client not initialized");
    return supabase;
  }

  async getAllOrders(): Promise<Order[]> {
    const supabase = getSupabase();
    if (!supabase) return [];

    try {
      // Production: Use lowercase table names and standard joins
      // We attempt to fetch orders with users and items.
      // Note: If RLS is enabled on Supabase, ensure 'select' policy is active for Authenticated users.
      const { data, error } = await supabase
        .from('orders')
        .select(`
            *,
            users (*),
            order_items (*, products (*))
        `)
        .order('order_date', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false }); // Fallback sort

      if (error) {
        console.error("Supabase Error (Orders):", error);
        // Fallback: Try PascalCase if lowercase failed (Legacy DB compatibility)
        if (error.code === '42P01') { // undefined_table
            return this.getAllOrdersLegacy();
        }
        return [];
      }

      return (data || []).map(o => this.mapToDomain(o));
    } catch (err) {
      console.error("OrderService Error:", err);
      return [];
    }
  }

  // Fallback for Legacy Tables (PascalCase)
  private async getAllOrdersLegacy(): Promise<Order[]> {
    const supabase = getSupabase();
    if (!supabase) return [];
    const { data } = await supabase.from('Orders').select(`*, User:Users(*), OrderItems:OrderItems(*, Product:Products(*))`);
    return (data || []).map(o => this.mapToDomain(o));
  }

  async getOrderById(id: number): Promise<Order | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
        const { data, error } = await supabase
        .from('orders')
        .select(`
            *,
            users (*),
            order_items (*, products (*))
        `)
        .eq('id', id)
        .single();
        
        if (error) return null;
        return this.mapToDomain(data);
    } catch {
        return null;
    }
  }

  async updateOrderLabelStatus(orderId: number, isPrinted: boolean, labelUrl?: string): Promise<Order> {
    const supabase = this.getClient();

    // Try update with snake_case columns first
    const updatePayload = { 
        is_label_printed: isPrinted,
        label_url: labelUrl,
        label_printed_date: isPrinted ? new Date().toISOString() : null,
        status: isPrinted ? 'Processing' : 'Pending'
    };

    const { data, error } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', orderId)
      .select(`*, users(*), order_items(*, products(*))`)
      .single();

    if (error) {
        // Fallback for PascalCase DB columns
        const legacyPayload = {
            IsLabelPrinted: isPrinted,
            LabelUrl: labelUrl,
            LabelPrintedDate: isPrinted ? new Date().toISOString() : null,
            Status: isPrinted ? 'Processing' : 'Pending'
        };
        const { data: legacyData, error: legacyError } = await supabase
            .from('Orders')
            .update(legacyPayload)
            .eq('Id', orderId)
            .select(`*, User:Users(*), OrderItems:OrderItems(*, Product:Products(*))`)
            .single();
            
        if (legacyError) throw new Error(legacyError.message);
        return this.mapToDomain(legacyData);
    }
    
    return this.mapToDomain(data);
  }

  // Robust Mapper: Handles both snake_case (Supabase default) and PascalCase (C# Legacy)
  private mapToDomain(dbItem: any): Order {
    // 1. Resolve User
    // Could be 'users' (lowercase join) or 'User' (Pascal join)
    const rawUser = dbItem.users || dbItem.User || dbItem.user;
    let user: User | undefined;
    
    if (rawUser) {
        user = {
            id: rawUser.id || rawUser.Id,
            email: rawUser.email || rawUser.Email,
            firstName: rawUser.first_name || rawUser.FirstName,
            lastName: rawUser.last_name || rawUser.LastName,
            address: rawUser.address || rawUser.Address,
            role: rawUser.role || rawUser.Role,
            authId: rawUser.auth_id || rawUser.AuthId
        };
    }

    // 2. Resolve Order Items
    const rawItems = dbItem.order_items || dbItem.OrderItems || [];
    const items: OrderItem[] = rawItems.map((i: any) => {
        const rawProd = i.products || i.Product || i.product;
        return {
            id: i.id || i.Id,
            quantity: i.quantity || i.Quantity,
            unitPrice: i.unit_price || i.UnitPrice,
            orderId: i.order_id || i.OrderId,
            productId: i.product_id || i.ProductId,
            product: rawProd ? {
                id: rawProd.id || rawProd.Id,
                name: rawProd.name || rawProd.Name,
                description: rawProd.description || rawProd.Description,
                imageUrl: rawProd.image_url || rawProd.ImageUrl,
                price: rawProd.price || rawProd.Price,
                stockQuantity: rawProd.stock_quantity || rawProd.StockQuantity,
                inspiredBy: rawProd.inspired_by || rawProd.InspiredBy,
                gender: rawProd.gender || rawProd.Gender,
                isOnSale: rawProd.is_on_sale || rawProd.IsOnSale,
                isNew: rawProd.is_new || rawProd.IsNew,
                rating: rawProd.rating || rawProd.Rating,
                reviewCount: rawProd.review_count || rawProd.ReviewCount,
                categoryId: rawProd.category_id || rawProd.CategoryId
            } : undefined
        };
    });

    // 3. Resolve Root Order Fields
    return {
        id: dbItem.id || dbItem.Id,
        orderDate: dbItem.order_date || dbItem.OrderDate || new Date().toISOString(),
        totalAmount: dbItem.total_amount || dbItem.TotalAmount || 0,
        orderNumber: dbItem.order_number || dbItem.OrderNumber || 'UNKNOWN',
        stripePaymentIntentId: dbItem.stripe_payment_intent_id || dbItem.StripePaymentIntentId,
        status: dbItem.status || dbItem.Status || 'Pending',
        userId: dbItem.user_id || dbItem.UserId,
        user,
        orderItems: items,
        isLabelPrinted: dbItem.is_label_printed || dbItem.IsLabelPrinted || false,
        labelPrintedDate: dbItem.label_printed_date || dbItem.LabelPrintedDate,
        labelUrl: dbItem.label_url || dbItem.LabelUrl,
        
        // Address Snapshots
        shippingAddressSnapshot: dbItem.shipping_address_snapshot || dbItem.ShippingAddressSnapshot,
        shippingCitySnapshot: dbItem.shipping_city_snapshot || dbItem.ShippingCitySnapshot,
        shippingCountrySnapshot: dbItem.shipping_country_snapshot || dbItem.ShippingCountrySnapshot,
        shippingPostalCodeSnapshot: dbItem.shipping_postal_code_snapshot || dbItem.ShippingPostalCodeSnapshot,
        shippingPhoneSnapshot: dbItem.shipping_phone_snapshot || dbItem.ShippingPhoneSnapshot,
        shippingStateSnapshot: dbItem.shipping_state_snapshot || dbItem.ShippingStateSnapshot,
        shippingZipSnapshot: dbItem.shipping_zip_snapshot || dbItem.ShippingZipSnapshot
    };
  }
}

export const orderService = new OrderService();