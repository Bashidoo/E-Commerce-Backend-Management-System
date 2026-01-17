// Domain Models matching the provided C# structure (adapted for TypeScript)

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  address: string;
  role: string;
  authId?: string; // Links to Supabase Auth UUID
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
  // Soft Delete fields
  isDeleted?: boolean; 
  deletedAt?: string | null; // ISO Date string
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
  
  // Label Printing Fields
  isLabelPrinted: boolean;
  labelPrintedDate?: string | null; // ISO Date string
  labelUrl?: string | null; // URL to the PDF label

  // Address Snapshot Fields (Matches SQL Schema)
  shippingAddressSnapshot?: string;
  shippingCitySnapshot?: string;
  shippingCountrySnapshot?: string;
  shippingPostalCodeSnapshot?: string;
  shippingPhoneSnapshot?: string;
  shippingStateSnapshot?: string;
  shippingZipSnapshot?: string;
}

export interface SupportTicket {
  id: number;
  userId: number;
  user?: User; // Hydrated on frontend
  orderId?: number | null;
  orderNumber?: string;
  ticketNumber: string; // "TKT-2024-001"
  subject: string;
  description: string;
  status: 'Open' | 'Resolved' | 'Closed';
  priority: 'Low' | 'Medium' | 'High';
  createdAt: string;
  lastUpdated?: string;
}

export interface PrinterDevice {
  uid: string; // Unique ID (MAC or Name)
  name: string;
  connection: 'lan' | 'bluetooth';
  deviceObj?: any; // BluetoothDevice object or BrowserPrint device object
}

export interface AppSettings {
  connectionString: string;
  printerName: string; // Legacy field for string name
  selectedPrinter?: PrinterDevice; // New field for full device object
  autoPrint: boolean;
  // Sendify Integration
  sendifyApiUrl: string;
  sendifyApiKey: string;
}