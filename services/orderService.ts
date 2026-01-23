import { Order } from '../types';

// Default to localhost for dev, using optional chaining to prevent crash if env is undefined
const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080/api';

class OrderService {
  
  async getAllOrders(): Promise<Order[]> {
    try {
      const response = await fetch(`${API_URL}/orders`);
      if (!response.ok) throw new Error('Failed to fetch orders');
      
      const data = await response.json();
      // The API returns DTOs that match our frontend types mostly, but dates are strings
      return data.map((o: any) => ({
        ...o,
        // Ensure date strings are preserved or parsed as needed
        orderDate: o.orderDate, 
        // Backend DTO might shape User/Items slightly differently, adjust mapping if needed
        // Assuming AutoMapper maps structure correctly
      }));
    } catch (error) {
      console.error("API Error:", error);
      return [];
    }
  }

  async getOrderById(id: number): Promise<Order | null> {
    try {
      const response = await fetch(`${API_URL}/orders/${id}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error("API Error:", error);
      return null;
    }
  }

  async updateOrderLabelStatus(orderId: number, isPrinted: boolean, labelUrl?: string): Promise<Order> {
    const response = await fetch(`${API_URL}/orders/${orderId}/label`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPrinted, labelUrl })
    });

    if (!response.ok) throw new Error('Failed to update order status');
    
    // In a real app, refetch the updated order to get the full object back
    const updated = await this.getOrderById(orderId);
    if (!updated) throw new Error('Order not found after update');
    
    return updated;
  }
}

export const orderService = new OrderService();