import { Order, Product, User, Category } from '../types';

export const mockCategories: Category[] = [
  { id: 1, name: "Perfume" },
  { id: 2, name: "Cologne" },
  { id: 3, name: "Gift Sets" },
  { id: 4, name: "Travel Size" }
];

const users: User[] = [
  { id: 1, email: "john.doe@example.com", firstName: "John", lastName: "Doe", address: "123 Maple St, Springfield", role: "Customer" },
  { id: 2, email: "jane.smith@example.com", firstName: "Jane", lastName: "Smith", address: "456 Oak Ave, Metropolis", role: "Customer" },
];

export const mockProducts: Product[] = [
  {
    id: 101,
    name: "Midnight Orchid",
    description: "A deep, mysterious floral scent.",
    imageUrl: "https://picsum.photos/400/400?random=1",
    price: 85.00,
    stockQuantity: 50,
    inspiredBy: "Tom Ford Black Orchid",
    gender: "Unisex",
    isOnSale: false,
    isNew: true,
    rating: 4.8,
    reviewCount: 120,
    categoryId: 1,
    category: mockCategories[0]
  },
  {
    id: 102,
    name: "Ocean Breeze",
    description: "Crisp and refreshing marine notes.",
    imageUrl: "https://picsum.photos/400/400?random=2",
    price: 60.00,
    stockQuantity: 30,
    inspiredBy: "Acqua Di Gio",
    gender: "Men",
    isOnSale: true,
    originalPrice: 75.00,
    isNew: false,
    rating: 4.5,
    reviewCount: 85,
    categoryId: 2,
    category: mockCategories[1]
  },
  {
    id: 103,
    name: "Vanilla Silk",
    description: "Warm and comforting vanilla essence.",
    imageUrl: "https://picsum.photos/400/400?random=3",
    price: 90.00,
    stockQuantity: 20,
    inspiredBy: "Mon Guerlain",
    gender: "Women",
    isOnSale: false,
    isNew: false,
    rating: 4.9,
    reviewCount: 200,
    categoryId: 1,
    category: mockCategories[0]
  }
];

export const mockOrders: Order[] = [
  {
    id: 1001,
    orderNumber: "DNO-A1B2",
    orderDate: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    totalAmount: 145.00,
    status: "Pending",
    userId: 1,
    user: users[0],
    isLabelPrinted: false,
    orderItems: [
      { id: 1, quantity: 1, unitPrice: 85.00, orderId: 1001, productId: 101, product: mockProducts[0] },
      { id: 2, quantity: 1, unitPrice: 60.00, orderId: 1001, productId: 102, product: mockProducts[1] }
    ]
  },
  {
    id: 1002,
    orderNumber: "DNO-C3D4",
    orderDate: new Date(Date.now() - 86400000 * 1).toISOString(), // 1 day ago
    totalAmount: 90.00,
    status: "Processing",
    userId: 2,
    user: users[1],
    isLabelPrinted: true,
    labelPrintedDate: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    orderItems: [
      { id: 3, quantity: 1, unitPrice: 90.00, orderId: 1002, productId: 103, product: mockProducts[2] }
    ]
  },
  {
    id: 1003,
    orderNumber: "DNO-E5F6",
    orderDate: new Date().toISOString(), // Today
    totalAmount: 170.00,
    status: "Pending",
    userId: 1,
    user: users[0],
    isLabelPrinted: false,
    orderItems: [
      { id: 4, quantity: 2, unitPrice: 85.00, orderId: 1003, productId: 101, product: mockProducts[0] }
    ]
  },
];