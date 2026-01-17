import { Order, OrderItem, User } from '../types';
import { getSupabase } from '../lib/supabaseClient';

class OrderService {
  
  private getClient() {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Database not configured.");
    return supabase;
  }

  async getAllOrders(): Promise<Order[]> {
    const supabase = getSupabase();
    if (!supabase) return [];

    // Select Orders with Users and OrderItems (joined with Products)
    // Note: Supabase nested joins syntax
    const { data, error } = await supabase
      .from('Orders')
      .select(`
        *,
        User:Users(*),
        OrderItems:OrderItems(
          *,
          Product:Products(*)
        )
      `)
      .order('OrderDate', { ascending: false });

    if (error) {
      console.error("Error fetching orders:", error);
      return [];
    }

    return (data || []).map((o: any) => this.mapDBOrderToDomain(o));
  }

  async getOrderById(id: number): Promise<Order | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('Orders')
      .select(`
        *,
        User:Users(*),
        OrderItems:OrderItems(
          *,
          Product:Products(*)
        )
      `)
      .eq('Id', id)
      .single();

    if (error || !data) return null;

    return this.mapDBOrderToDomain(data);
  }

  async updateOrderLabelStatus(orderId: number, isPrinted: boolean, labelUrl?: string): Promise<Order> {
    const supabase = this.getClient();

    const updatePayload: any = {
        IsLabelPrinted: isPrinted,
        LabelPrintedDate: isPrinted ? new Date().toISOString() : null
    };
    if (labelUrl) updatePayload.LabelUrl = labelUrl;

    const { data, error } = await supabase
        .from('Orders')
        .update(updatePayload)
        .eq('Id', orderId)
        .select(`
            *,
            User:Users(*),
            OrderItems:OrderItems(
              *,
              Product:Products(*)
            )
        `)
        .single();

    if (error) throw error;
    return this.mapDBOrderToDomain(data);
  }

  // --- Mappers ---

  private mapDBOrderToDomain(dbOrder: any): Order {
    // Map User
    let user: User | undefined;
    if (dbOrder.User) {
        user = {
            id: dbOrder.User.Id,
            email: dbOrder.User.Email,
            firstName: dbOrder.User.FirstName,
            lastName: dbOrder.User.LastName,
            address: dbOrder.User.Address,
            role: dbOrder.User.Role
        };
    }

    // Map Items
    const orderItems: OrderItem[] = (dbOrder.OrderItems || []).map((item: any) => ({
        id: item.Id,
        quantity: item.Quantity,
        unitPrice: item.UnitPrice,
        orderId: item.OrderId,
        productId: item.ProductId,
        product: item.Product ? {
            id: item.Product.Id,
            name: item.Product.Name,
            description: item.Product.Description,
            imageUrl: item.Product.ImageUrl,
            price: item.Product.Price,
            stockQuantity: item.Product.StockQuantity,
            inspiredBy: item.Product.InspiredBy,
            gender: item.Product.Gender,
            isOnSale: false,
            isNew: false,
            rating: 0,
            reviewCount: 0,
            categoryId: item.Product.CategoryId,
            isDeleted: item.Product.IsDeleted
        } : undefined
    }));

    return {
        id: dbOrder.Id,
        orderDate: dbOrder.OrderDate,
        totalAmount: dbOrder.TotalAmount,
        orderNumber: dbOrder.OrderNumber,
        stripePaymentIntentId: dbOrder.StripePaymentIntentId,
        status: dbOrder.Status,
        userId: dbOrder.UserId,
        user,
        orderItems,
        isLabelPrinted: dbOrder.IsLabelPrinted,
        labelPrintedDate: dbOrder.LabelPrintedDate,
        labelUrl: dbOrder.LabelUrl,
        shippingAddressSnapshot: dbOrder.ShippingAddressSnapshot,
        shippingCitySnapshot: dbOrder.ShippingCitySnapshot,
        shippingCountrySnapshot: dbOrder.ShippingCountrySnapshot,
        shippingPostalCodeSnapshot: dbOrder.ShippingPostalCodeSnapshot,
        shippingPhoneSnapshot: dbOrder.ShippingPhoneSnapshot,
        shippingStateSnapshot: dbOrder.ShippingStateSnapshot,
        shippingZipSnapshot: dbOrder.ShippingZipSnapshot
    };
  }
}

export const orderService = new OrderService();
