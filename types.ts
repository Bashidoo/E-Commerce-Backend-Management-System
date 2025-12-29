// Domain Models matching the provided C# structure (adapted for TypeScript)

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  address: string;
  role: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  stockQuantity: number;
  // Frontend specific fields
  inspiredBy: string;
  gender: 'Men' | 'Women' | 'Unisex';
  originalPrice?: number | null;
  isOnSale: boolean;
  isNew: boolean;
  rating: number;
  reviewCount: number;
  categoryId: number;
  category?: Category;
}

export interface OrderItem {
  id: number;
  quantity: number;
  unitPrice: number;
  orderId: number;
  productId: number;
  product?: Product;
}

export interface Order {
  id: number;
  orderDate: string; // ISO Date string
  totalAmount: number;
  orderNumber: string;
  stripePaymentIntentId?: string;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  userId?: number | null;
  user?: User;
  orderItems: OrderItem[];
  
  // Extension fields for Label Printing System
  isLabelPrinted: boolean;
  labelPrintedDate?: string | null; // ISO Date string
}

export interface AppSettings {
  connectionString: string;
  printerName: string;
  autoPrint: boolean;
}