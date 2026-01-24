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

    console.log("Fetching Orders... (v2 - Strict Sort)"); // Debug log to confirm code update

    try {
      // Query "Orders" (PascalCase) and strictly sort by OrderDate
      const { data, error } = await supabase
        .from('Orders')
        .select(`
            *,
            Users (*),
            OrderItems (*, Products (*))
        `)
        .order('OrderDate', { ascending: false, nullsFirst: false });

      if (error) {
        console.error("Supabase Error (Orders):", error);
        return [];
      }

      return (data || []).map(o => this.mapToDomain(o));
    } catch (err) {
      console.error("OrderService Error:", err);
      return [];
    }
  }

  async getOrderById(id: number): Promise<Order | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
        const { data, error } = await supabase
        .from('Orders')
        .select(`
            *,
            Users (*),
            OrderItems (*, Products (*))
        `)
        .eq('Id', id)
        .single();
        
        if (error) return null;
        return this.mapToDomain(data);
    } catch {
        return null;
    }
  }

  async updateOrderLabelStatus(orderId: number, isPrinted: boolean, labelUrl?: string): Promise<Order> {
    const supabase = this.getClient();

    const updatePayload = { 
        IsLabelPrinted: isPrinted,
        LabelUrl: labelUrl,
        LabelPrintedDate: isPrinted ? new Date().toISOString() : null,
        Status: isPrinted ? 'Processing' : 'Pending'
    };

    const { data, error } = await supabase
      .from('Orders')
      .update(updatePayload)
      .eq('Id', orderId)
      .select(`*, Users(*), OrderItems(*, Products(*))`)
      .single();

    if (error) {
        console.error("Failed to update order label status", error);
        throw new Error(error.message);
    }
    
    return this.mapToDomain(data);
  }

  private mapToDomain(dbItem: any): Order {
    const rawUser = dbItem.Users || dbItem.users;
    let user: User | undefined;
    
    if (rawUser) {
        user = {
            id: rawUser.Id,
            email: rawUser.Email,
            firstName: rawUser.FirstName,
            lastName: rawUser.LastName,
            address: rawUser.Address,
            role: rawUser.Role,
            authId: rawUser.AuthId
        };
    }

    const rawItems = dbItem.OrderItems || dbItem.order_items || [];
    const items: OrderItem[] = rawItems.map((i: any) => {
        const rawProd = i.Products || i.products;
        return {
            id: i.Id,
            quantity: i.Quantity,
            unitPrice: i.UnitPrice,
            orderId: i.OrderId,
            productId: i.ProductId,
            product: rawProd ? {
                id: rawProd.Id,
                name: rawProd.Name,
                description: rawProd.Description,
                imageUrl: rawProd.ImageUrl,
                price: rawProd.Price,
                stockQuantity: rawProd.StockQuantity,
                inspiredBy: rawProd.InspiredBy,
                gender: rawProd.Gender,
                isOnSale: rawProd.IsOnSale,
                isNew: rawProd.IsNew,
                rating: rawProd.Rating,
                reviewCount: rawProd.ReviewCount,
                categoryId: rawProd.CategoryId
            } : undefined
        };
    });

    return {
        id: dbItem.Id,
        orderDate: dbItem.OrderDate || new Date().toISOString(),
        totalAmount: dbItem.TotalAmount || 0,
        orderNumber: dbItem.OrderNumber || 'UNKNOWN',
        stripePaymentIntentId: dbItem.StripePaymentIntentId,
        status: dbItem.Status || 'Pending',
        userId: dbItem.UserId,
        user,
        orderItems: items,
        isLabelPrinted: dbItem.IsLabelPrinted || false,
        labelPrintedDate: dbItem.LabelPrintedDate,
        labelUrl: dbItem.LabelUrl,
        shippingAddressSnapshot: dbItem.ShippingAddressSnapshot,
        shippingCitySnapshot: dbItem.ShippingCitySnapshot,
        shippingCountrySnapshot: dbItem.ShippingCountrySnapshot,
        shippingPostalCodeSnapshot: dbItem.ShippingPostalCodeSnapshot,
        shippingPhoneSnapshot: dbItem.ShippingPhoneSnapshot,
        shippingStateSnapshot: dbItem.ShippingStateSnapshot,
        shippingZipSnapshot: dbItem.ShippingZipSnapshot
    };
  }
}

export const orderService = new OrderService();