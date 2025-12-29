import { Order } from '../types';
import { mockOrders } from './mockData';

// Simulating a Repository Pattern
class OrderRepository {
  private orders: Order[] = [...mockOrders];

  // Emulate Async DB Call
  async getAllOrders(): Promise<Order[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...this.orders]);
      }, 600); // Simulate network latency
    });
  }

  async getOrderById(id: number): Promise<Order | undefined> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this.orders.find(o => o.id === id));
      }, 300);
    });
  }

  async updateOrderLabelStatus(orderId: number, isPrinted: boolean): Promise<Order> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const orderIndex = this.orders.findIndex(o => o.id === orderId);
        if (orderIndex === -1) {
          reject(new Error("Order not found"));
          return;
        }

        const updatedOrder = {
          ...this.orders[orderIndex],
          isLabelPrinted: isPrinted,
          labelPrintedDate: isPrinted ? new Date().toISOString() : null
        };

        this.orders[orderIndex] = updatedOrder;
        resolve(updatedOrder);
      }, 500); // Simulate DB write
    });
  }
}

export const orderService = new OrderRepository();