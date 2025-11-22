// Product types for MaisonMiaro clothing items
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  salePrice?: number;
  images: string[];
  imageFrames?: number; // Number of 360 view frames available
  model3d?: string; // Path to 3D model file
  category: Category;
  sizes: Size[];
  colors: Color[];
  inStock: boolean;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Size {
  id: string;
  name: string;
  value: string; // XS, S, M, L, XL, etc.
}

export interface Color {
  id: string;
  name: string;
  hex: string;
}

// Shopping cart types
export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize: Size;
  selectedColor: Color;
}

export interface Cart {
  items: CartItem[];
  total: number;
  itemCount: number;
}

// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  isAdmin: boolean;
  createdAt: Date;
  address?: Address;
}

// Order types
export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  shippingAddress: Address;
  billingAddress: Address;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

// Filter types
export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sizes?: string[];
  colors?: string[];
  inStock?: boolean;
  featured?: boolean;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Admin types
export interface Admin {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'super_admin';
  createdAt: Date;
}

export interface AdminLoginCredentials {
  email: string;
  password: string;
}

export interface ProductWithInventory extends Product {
  stock: number;
  sold: number;
  revenue: string;
}

export interface AdminOrder {
  id: string;
  customer: {
    name: string;
    email: string;
  };
  items: AdminOrderItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: Date;
  updatedAt?: Date;
  shippingAddress: string;
  trackingNumber?: string;
  deliveredAt?: Date;
}

export interface AdminOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  size?: string;
  color?: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  price: number;
  salePrice?: number;
  size: Size;
  color: Color;
  stock: number;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  barcode?: string;
  isActive: boolean;
}
