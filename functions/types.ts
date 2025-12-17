// Type definitions for Cloudflare Pages Functions

export interface Env {
  // Environment variables
  ENVIRONMENT: string;
  API_KEY?: string;
  
  // D1 Database
  DB?: D1Database;
  
  // KV Namespaces
  TABLES_KV?: KVNamespace;
  SESSIONS_KV?: KVNamespace;
  
  // R2 Storage
  ASSETS?: R2Bucket;
  
  // Durable Objects
  ORDERS_DO?: DurableObjectNamespace;
  
  // Analytics
  ANALYTICS?: AnalyticsEngineDataset;
}

// Order types
export interface Order {
  id: string;
  customer: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  table?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  modifiers?: string[];
  notes?: string;
}

export type OrderStatus = 'new' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

// Table types
export interface Table {
  id: string;
  seats: number;
  status: TableStatus;
  time?: string;
  guests?: number;
  currentOrder?: string;
}

export type TableStatus = 
  | 'Available'
  | 'Ordering'
  | 'Ordered'
  | 'Reserved'
  | 'Seated'
  | 'Running Late'
  | '1st Course'
  | '2nd Course'
  | '3rd Course'
  | 'Dessert'
  | 'Partially Seated'
  | 'Served'
  | 'Paid';

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  count?: number;
}

// User/Staff types
export interface User {
  id: string;
  name: string;
  role: 'admin' | 'manager' | 'server' | 'kitchen' | 'host';
  avatar?: string;
}
